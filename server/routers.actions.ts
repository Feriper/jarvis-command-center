import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

const actionType = z.enum(["task", "message", "publish", "financial", "other"]);

export const actionsRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.listAssistantActions(ctx.user.id)),

  propose: protectedProcedure
    .input(z.object({
      type: actionType,
      title: z.string().min(1).max(255),
      description: z.string().min(1),
      payload: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createAssistantAction({
        userId: ctx.user.id,
        type: input.type,
        title: input.title,
        description: input.description,
        payload: input.payload,
        status: "pending",
      });
      if (!result) throw new Error("Banco de dados indisponível para registrar a ação.");
      return { success: true, actionId: result.insertId, status: "pending" as const };
    }),

  approve: protectedProcedure
    .input(z.object({ actionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.updateAssistantAction(input.actionId, ctx.user.id, {
        status: "approved",
        approvedAt: new Date(),
      });
      if (!result) throw new Error("Banco de dados indisponível para aprovar a ação.");
      return { success: true, status: "approved" as const, execution: "blocked_until_explicit_executor" as const };
    }),

  reject: protectedProcedure
    .input(z.object({ actionId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.updateAssistantAction(input.actionId, ctx.user.id, { status: "rejected" });
      if (!result) throw new Error("Banco de dados indisponível para rejeitar a ação.");
      return { success: true, status: "rejected" as const };
    }),
});
