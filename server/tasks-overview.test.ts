import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";

const now = new Date(2026, 7, 14, 10, 0, 0, 0);
const today = new Date(2026, 7, 14, 12, 0, 0, 0);
const tomorrow = new Date(2026, 7, 15, 12, 0, 0, 0);

const tasks = [
  {
    id: 1,
    userId: 1,
    title: "Tarefa atrasada",
    description: null,
    status: "pending" as const,
    priority: "high" as const,
    dueDate: new Date(now.getTime() - 60 * 60 * 1000),
    reminderTime: null,
    reminderSent: false,
    category: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 2,
    userId: 1,
    title: "Tarefa de hoje",
    description: null,
    status: "in_progress" as const,
    priority: "medium" as const,
    dueDate: today,
    reminderTime: null,
    reminderSent: false,
    category: null,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 3,
    userId: 1,
    title: "Próxima tarefa",
    description: null,
    status: "pending" as const,
    priority: "low" as const,
    dueDate: tomorrow,
    reminderTime: null,
    reminderSent: false,
    category: null,
    createdAt: now,
    updatedAt: now,
  },
];

vi.mock("./db", () => ({
  getTasks: vi.fn(async () => tasks),
  getAdCampaigns: vi.fn(async () => []),
  getAlerts: vi.fn(async () => []),
}));

describe("Tasks overview", () => {
  const caller = appRouter.createCaller({ user: { id: 1 } } as any);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("separa tarefas atrasadas, de hoje e próximas", async () => {
    const result = await caller.tasks.overview();

    expect(result.totals).toEqual({ all: 3, active: 3, completed: 0 });
    expect(result.overdue.map(task => task.id)).toEqual([1]);
    expect(result.dueToday.map(task => task.id)).toEqual([2]);
    expect(result.next.map(task => task.id)).toEqual([3]);
  });
});
