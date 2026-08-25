import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  ChatMessage,
  Conversation,
  InsertChatMessage,
  InsertConversation,
  InsertUser,
  InsertUserMemory,
  User,
  UserMemory,
} from "../drizzle/schema";

const LOCAL_OPEN_ID = "jarvis-local-user";
const dataDirectory = path.resolve(
  process.env.JARVIS_DATA_DIR || path.join(process.cwd(), "data")
);
const stateFile = path.join(dataDirectory, "jarvis-state.json");
const maxLocalMessages = Math.max(20, Number(process.env.JARVIS_MAX_LOCAL_MESSAGES || 80));
const maxLocalConversations = Math.max(5, Number(process.env.JARVIS_MAX_LOCAL_CONVERSATIONS || 20));
const maxLocalMemory = Math.max(20, Number(process.env.JARVIS_MAX_LOCAL_MEMORY || 200));

type LocalState = {
  user: User | null;
  nextConversationId: number;
  nextMessageId: number;
  nextMemoryId: number;
  conversations: Conversation[];
  messages: ChatMessage[];
  memory: UserMemory[];
};

const emptyState = (): LocalState => ({
  user: null,
  nextConversationId: 1,
  nextMessageId: 1,
  nextMemoryId: 1,
  conversations: [],
  messages: [],
  memory: [],
});

const asDate = (value: unknown, fallback: Date): Date => {
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const normalizeState = (raw: Partial<LocalState>): LocalState => {
  const now = new Date();
  return {
    user: raw.user
      ? {
          ...raw.user,
          createdAt: asDate(raw.user.createdAt, now),
          updatedAt: asDate(raw.user.updatedAt, now),
          lastSignedIn: asDate(raw.user.lastSignedIn, now),
        }
      : null,
    nextConversationId: raw.nextConversationId || 1,
    nextMessageId: raw.nextMessageId || 1,
    nextMemoryId: raw.nextMemoryId || 1,
    conversations: (raw.conversations || []).map(item => ({
      ...item,
      createdAt: asDate(item.createdAt, now),
      updatedAt: asDate(item.updatedAt, now),
    })),
    messages: (raw.messages || []).map(item => ({
      ...item,
      createdAt: asDate(item.createdAt, now),
    })),
    memory: (raw.memory || []).map(item => ({
      ...item,
      createdAt: asDate(item.createdAt, now),
      updatedAt: asDate(item.updatedAt, now),
    })),
  };
};

async function readState(): Promise<LocalState> {
  try {
    const raw = JSON.parse(await readFile(stateFile, "utf8")) as Partial<LocalState>;
    return normalizeState(raw);
  } catch {
    return emptyState();
  }
}

async function writeState(state: LocalState): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });
  const temporaryFile = `${stateFile}.${randomUUID()}.tmp`;
  await writeFile(temporaryFile, JSON.stringify(state, null, 2), "utf8");
  await rename(temporaryFile, stateFile);
}

let operationQueue = Promise.resolve();

function withState<T>(operation: (state: LocalState) => Promise<T> | T): Promise<T> {
  const next = operationQueue.then(async () => {
    const state = await readState();
    const result = await operation(state);
    await writeState(state);
    return result;
  });
  operationQueue = next.then(() => undefined, () => undefined);
  return next;
}

export async function getLocalUser(openId = LOCAL_OPEN_ID): Promise<User> {
  return withState(state => {
    const now = new Date();
    if (state.user?.openId === openId) {
      state.user.lastSignedIn = now;
      state.user.updatedAt = now;
      return state.user;
    }

    const user: User = {
      id: 1,
      openId,
      name: process.env.JARVIS_LOCAL_USER_NAME || "Usuário local",
      email: process.env.JARVIS_LOCAL_USER_EMAIL || null,
      loginMethod: "local",
      role: "admin",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
    state.user = user;
    return user;
  });
}

export async function upsertLocalUser(input: InsertUser): Promise<User> {
  return withState(state => {
    const now = new Date();
    const current = state.user || {
      id: 1,
      openId: input.openId || LOCAL_OPEN_ID,
      name: null,
      email: null,
      loginMethod: "local",
      role: "admin" as const,
      createdAt: now,
      updatedAt: now,
      lastSignedIn: now,
    };
    state.user = {
      ...current,
      ...input,
      id: current.id,
      openId: input.openId || current.openId,
      createdAt: current.createdAt,
      updatedAt: now,
      lastSignedIn: input.lastSignedIn || now,
      role: input.role || current.role,
    };
    return state.user;
  });
}

export async function getLocalConversations(userId: number): Promise<Conversation[]> {
  const state = await readState();
  return state.conversations
    .filter(item => item.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function createLocalConversation(
  input: InsertConversation
): Promise<{ insertId: number }> {
  return withState(state => {
    const now = new Date();
    const id = state.nextConversationId++;
    state.conversations.push({
      id,
      userId: input.userId,
      title: input.title || "Nova Conversa",
      summary: input.summary || null,
      createdAt: now,
      updatedAt: now,
    });

    const excessConversationIds = state.conversations
      .filter(item => item.userId === input.userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(maxLocalConversations)
      .map(item => item.id);
    if (excessConversationIds.length > 0) {
      state.conversations = state.conversations.filter(
        item => !excessConversationIds.includes(item.id)
      );
      state.messages = state.messages.filter(
        item => !excessConversationIds.includes(item.conversationId)
      );
    }
    return { insertId: id };
  });
}

export async function getLocalMessages(conversationId: number): Promise<ChatMessage[]> {
  const state = await readState();
  return state.messages
    .filter(item => item.conversationId === conversationId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export async function saveLocalMessage(input: InsertChatMessage): Promise<{ insertId: number }> {
  return withState(state => {
    const id = state.nextMessageId++;
    state.messages.push({
      id,
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      metadata: input.metadata || null,
      createdAt: input.createdAt || new Date(),
    });

    const conversationMessages = state.messages
      .filter(item => item.conversationId === input.conversationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const keepMessageIds = new Set(
      conversationMessages.slice(0, maxLocalMessages).map(item => item.id)
    );
    state.messages = state.messages.filter(
      item => item.conversationId !== input.conversationId || keepMessageIds.has(item.id)
    );
    const conversation = state.conversations.find(item => item.id === input.conversationId);
    if (conversation) conversation.updatedAt = new Date();
    return { insertId: id };
  });
}

export async function getLocalMemory(userId: number, category?: string): Promise<UserMemory[]> {
  const state = await readState();
  return state.memory
    .filter(item => item.userId === userId && (!category || item.category === category))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function saveLocalMemory(input: InsertUserMemory): Promise<{ insertId: number }> {
  return withState(state => {
    const now = new Date();
    const existing = state.memory.find(
      item => item.userId === input.userId && item.key === input.key
    );
    if (existing) {
      existing.value = input.value;
      existing.category = input.category || null;
      existing.updatedAt = now;
      return { insertId: existing.id };
    }

    const id = state.nextMemoryId++;
    state.memory.push({
      id,
      userId: input.userId,
      key: input.key,
      value: input.value,
      category: input.category || null,
      createdAt: now,
      updatedAt: now,
    });
    state.memory = state.memory
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, maxLocalMemory);
    return { insertId: id };
  });
}

export function getLocalDataDirectory(): string {
  return dataDirectory;
}
