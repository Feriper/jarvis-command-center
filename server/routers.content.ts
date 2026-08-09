import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { buildContentPackage } from "./content-package";

const rightsReviewSchema = z.object({
  originalContributionConfirmed: z.boolean(),
  mediaLicensedOrOwned: z.boolean(),
  musicLicensedOrOwned: z.boolean(),
  thirdPartyPolicyReviewed: z.boolean(),
  notes: z.string().max(2000).optional(),
});

const platformSchema = z.enum(["youtube", "tiktok"]);

export const contentRouter = router({
  listDrafts: protectedProcedure.query(async ({ ctx }) => {
    return db.getContentDrafts(ctx.user.id);
  }),

  createDraft: protectedProcedure
    .input(z.object({
      platform: platformSchema,
      title: z.string().min(1).max(255),
      description: z.string().max(5000).optional(),
      script: z.string().min(1).max(100000),
      sourceUrls: z.array(z.string().url()).max(50).default([]),
      mediaUrls: z.array(z.string().url()).max(50).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createContentDraft({
        userId: ctx.user.id,
        platform: input.platform,
        title: input.title,
        description: input.description,
        script: input.script,
        sourceUrls: input.sourceUrls,
        mediaUrls: input.mediaUrls,
        rightsStatus: "pending",
        status: "draft",
      });

      if (!result) throw new Error("Banco de dados indisponível para salvar o rascunho.");
      return { success: true, draftId: result.insertId };
    }),

  preparePackage: protectedProcedure
    .input(z.object({ draftId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const draft = await db.getContentDraft(input.draftId, ctx.user.id);
      if (!draft) throw new Error("Rascunho não encontrado.");
      if (draft.status !== "draft") throw new Error("Somente rascunhos podem gerar um pacote.");

      const sourceUrls = Array.isArray(draft.sourceUrls)
        ? draft.sourceUrls.filter((value): value is string => typeof value === "string")
        : [];
      const contentPackage = buildContentPackage({
        title: draft.title,
        description: draft.description,
        script: draft.script,
        sourceUrls,
        platform: draft.platform,
      });
      await db.updateContentDraft(input.draftId, ctx.user.id, {
        description: contentPackage.description,
        tags: contentPackage.tags,
        captions: contentPackage.captions,
        thumbnailPrompt: contentPackage.thumbnailPrompt,
        productionNotes: contentPackage.productionNotes,
        packageStatus: "ready",
      });
      return { success: true, packageStatus: "ready" as const, contentPackage };
    }),

  reviewRights: protectedProcedure
    .input(z.object({
      draftId: z.number().int().positive(),
      review: rightsReviewSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const draft = await db.getContentDraft(input.draftId, ctx.user.id);
      if (!draft) throw new Error("Rascunho não encontrado.");
      if (draft.status !== "draft") throw new Error("Somente rascunhos podem passar por revisão.");

      const review = input.review;
      const verified = Object.values(review).filter(value => typeof value === "boolean").every(Boolean);
      const rightsStatus = verified ? "verified" : "blocked";
      await db.updateContentDraft(input.draftId, ctx.user.id, {
        rightsReview: review,
        rightsStatus,
      });

      return { success: true, rightsStatus };
    }),

  approveDraft: protectedProcedure
    .input(z.object({ draftId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const draft = await db.getContentDraft(input.draftId, ctx.user.id);
      if (!draft) throw new Error("Rascunho não encontrado.");
      if (draft.rightsStatus !== "verified") {
        throw new Error("O rascunho precisa passar pela revisão de direitos antes da aprovação.");
      }
      if (draft.status !== "draft") throw new Error("Somente rascunhos podem ser aprovados.");

      await db.updateContentDraft(input.draftId, ctx.user.id, {
        status: "approved",
        approvedAt: new Date(),
      });
      return { success: true, status: "approved" as const };
    }),

  rejectDraft: protectedProcedure
    .input(z.object({
      draftId: z.number().int().positive(),
      reason: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const draft = await db.getContentDraft(input.draftId, ctx.user.id);
      if (!draft) throw new Error("Rascunho não encontrado.");
      await db.updateContentDraft(input.draftId, ctx.user.id, {
        status: "rejected",
        rightsReview: { rejectionReason: input.reason },
      });
      return { success: true, status: "rejected" as const };
    }),
});
