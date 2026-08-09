import { describe, expect, it, vi, beforeEach } from "vitest";
import { contentRouter } from "./routers.content";

const state = {
  draft: {
    id: 42,
    userId: 1,
    platform: "youtube" as const,
    title: "Tendências de IA",
    description: "Resumo editorial",
    script: "Roteiro original",
    sourceUrls: ["https://example.com/source"],
    mediaUrls: [],
    rightsReview: null,
    rightsStatus: "pending" as "pending" | "verified" | "blocked",
    status: "draft" as "draft" | "approved" | "rejected" | "published" | "failed",
    approvedAt: null,
    publishedAt: null,
    externalPostId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

vi.mock("./db", () => ({
  createContentDraft: vi.fn(async () => ({ insertId: state.draft.id })),
  getContentDraft: vi.fn(async () => state.draft),
  getContentDrafts: vi.fn(async () => [state.draft]),
  updateContentDraft: vi.fn(async (_id: number, _userId: number, updates: any) => {
    Object.assign(state.draft, updates);
    return { affectedRows: 1 };
  }),
}));

describe("ContentRouter - aprovação segura", () => {
  const caller = contentRouter.createCaller({ user: { id: 1 } } as any);

  beforeEach(() => {
    state.draft.rightsStatus = "pending";
    state.draft.status = "draft";
    state.draft.rightsReview = null;
    state.draft.approvedAt = null;
  });

  it("cria rascunho pendente sem publicar externamente", async () => {
    const result = await caller.createDraft({
      platform: "youtube",
      title: "Tendências de IA",
      description: "Resumo editorial",
      script: "Roteiro original",
      sourceUrls: ["https://example.com/source"],
      mediaUrls: [],
    });

    expect(result).toEqual({ success: true, draftId: 42 });
    expect(state.draft.status).toBe("draft");
    expect(state.draft.rightsStatus).toBe("pending");
  });

  it("bloqueia aprovação antes da revisão de direitos", async () => {
    await expect(caller.approveDraft({ draftId: 42 })).rejects.toThrow("revisão de direitos");
  });

  it("exige todas as confirmações e aprova somente depois delas", async () => {
    const review = {
      originalContributionConfirmed: true,
      mediaLicensedOrOwned: true,
      musicLicensedOrOwned: true,
      thirdPartyPolicyReviewed: true,
      notes: "Material original e fonte registrada.",
    };

    const reviewed = await caller.reviewRights({ draftId: 42, review });
    expect(reviewed.rightsStatus).toBe("verified");

    const approved = await caller.approveDraft({ draftId: 42 });
    expect(approved.status).toBe("approved");
    expect(state.draft.approvedAt).toBeInstanceOf(Date);
  });
});
