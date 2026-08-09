import { beforeEach, describe, expect, it, vi } from "vitest";
import { actionsRouter } from "./routers.actions";

const state = {
  action: {
    id: 7,
    userId: 1,
    type: "financial" as const,
    title: "Enviar Pix",
    description: "Ação sensível aguardando confirmação.",
    payload: { amount: 10 },
    status: "pending" as const,
    approvedAt: null,
    executedAt: null,
  },
};

vi.mock("./db", () => ({
  listAssistantActions: vi.fn(async () => [state.action]),
  createAssistantAction: vi.fn(async () => ({ insertId: state.action.id })),
  updateAssistantAction: vi.fn(async (_id: number, _userId: number, updates: any) => {
    Object.assign(state.action, updates);
    return { affectedRows: 1 };
  }),
}));

describe("ActionsRouter - aprovação sem execução", () => {
  const caller = actionsRouter.createCaller({ user: { id: 1 } } as any);

  beforeEach(() => {
    state.action.status = "pending";
    state.action.approvedAt = null;
    state.action.executedAt = null;
  });

  it("registra uma ação financeira como pendente", async () => {
    const result = await caller.propose({
      type: "financial",
      title: "Enviar Pix",
      description: "Ação sensível aguardando confirmação.",
      payload: { amount: 10 },
    });
    expect(result.status).toBe("pending");
  });

  it("aprova sem executar e mantém executedAt vazio", async () => {
    const result = await caller.approve({ actionId: 7 });
    expect(result.status).toBe("approved");
    expect(result.execution).toBe("blocked_until_explicit_executor");
    expect(state.action.executedAt).toBeNull();
  });
});
