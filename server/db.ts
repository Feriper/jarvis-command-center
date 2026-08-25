import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  tasks, InsertTask, 
  conversations, InsertConversation, 
  chatMessages, InsertChatMessage,
  socialMediaAccounts, InsertSocialMediaAccount,
  adCampaigns, InsertAdCampaign,
  adMetrics, InsertAdMetric,
  alerts, InsertAlert,
  userMemory, InsertUserMemory,
  automationTriggers, InsertAutomationTrigger,
  agentTasks, InsertAgentTask,
  aiAgents, InsertAiAgent,
  sentimentAnalysis, InsertSentimentAnalysis,
  financialProjections, InsertFinancialProjection
} from "../drizzle/schema";
import { ENV } from './_core/env';
import {
  createLocalConversation,
  getLocalConversations,
  getLocalMessages,
  getLocalMemory,
  getLocalUser,
  saveLocalMemory,
  saveLocalMessage,
  upsertLocalUser,
} from "./local-store";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// User methods
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  if (ENV.localMode) {
    await upsertLocalUser(user);
    return;
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  if (ENV.localMode) {
    return openId === ENV.localOpenId ? await getLocalUser(openId) : undefined;
  }

  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Task methods
export async function getTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
}

export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(tasks).values(task);
  return result;
}

export async function updateTask(taskId: number, userId: number, updates: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(tasks).set(updates).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
}

export async function deleteTask(taskId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  return await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
}

// Chat methods
export async function getConversations(userId: number) {
  if (ENV.localMode) return getLocalConversations(userId);

  const db = await getDb();
  if (!db) return [];
  return await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function createConversation(conv: InsertConversation) {
  if (ENV.localMode) return createLocalConversation(conv);

  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(conversations).values(conv);
  return result;
}

export async function getMessages(conversationId: number) {
  if (ENV.localMode) return getLocalMessages(conversationId);

  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
}

export async function saveMessage(message: InsertChatMessage) {
  if (ENV.localMode) return saveLocalMessage(message);

  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(chatMessages).values(message);
  return result;
}

// Social Media methods
export async function getSocialAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(socialMediaAccounts).where(eq(socialMediaAccounts.userId, userId));
}

// Ads methods
export async function getAdCampaigns(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(adCampaigns).where(eq(adCampaigns.userId, userId));
}

export async function getAdMetrics(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(adMetrics).where(eq(adMetrics.campaignId, campaignId)).orderBy(desc(adMetrics.date)).limit(30);
}

// Alert methods
export async function getAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(alerts).where(eq(alerts.userId, userId)).orderBy(desc(alerts.createdAt));
}

// Memory & Knowledge methods
export async function getMemory(userId: number, category?: string) {
  if (ENV.localMode) return getLocalMemory(userId, category);

  const db = await getDb();
  if (!db) return [];
  
  const conditions = [eq(userMemory.userId, userId)];
  if (category) {
    conditions.push(eq(userMemory.category, category));
  }
  
  return await db.select()
    .from(userMemory)
    .where(and(...conditions));
}

export async function saveMemory(memory: InsertUserMemory) {
  if (ENV.localMode) return saveLocalMemory(memory);

  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(userMemory).values(memory).onDuplicateKeyUpdate({
    set: { value: memory.value, category: memory.category, updatedAt: new Date() }
  });
  return result;
}

// Automation methods
export async function getTriggers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(automationTriggers).where(eq(automationTriggers.userId, userId));
}

export async function createTrigger(trigger: InsertAutomationTrigger) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(automationTriggers).values(trigger);
  return result;
}

export async function updateTrigger(triggerId: number, userId: number, updates: Partial<InsertAutomationTrigger>) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(automationTriggers).set(updates).where(and(eq(automationTriggers.id, triggerId), eq(automationTriggers.userId, userId)));
}

// Agent methods
export async function getAgentTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(agentTasks).where(eq(agentTasks.userId, userId)).orderBy(desc(agentTasks.createdAt));
}

export async function createAgentTask(task: InsertAgentTask) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(agentTasks).values(task);
  return result;
}

export async function updateAgentTask(taskId: number, updates: Partial<InsertAgentTask>) {
  const db = await getDb();
  if (!db) return null;
  return await db.update(agentTasks).set(updates).where(eq(agentTasks.id, taskId));
}

// AI Agent methods
export async function getAiAgents(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(aiAgents).where(eq(aiAgents.userId, userId));
}

export async function createAiAgent(agent: InsertAiAgent) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(aiAgents).values(agent);
  return result;
}

// Sentiment Analysis methods
export async function getSentimentHistory(userId: number, accountId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (accountId) {
    return await db.select().from(sentimentAnalysis).where(
      and(
        eq(sentimentAnalysis.userId, userId),
        eq(sentimentAnalysis.accountId, accountId)
      )
    ).orderBy(desc(sentimentAnalysis.date));
  }
  return await db.select().from(sentimentAnalysis).where(eq(sentimentAnalysis.userId, userId)).orderBy(desc(sentimentAnalysis.date));
}

export async function saveSentiment(analysis: InsertSentimentAnalysis) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(sentimentAnalysis).values(analysis);
  return result;
}

// Financial Projection methods
export async function getFinancialProjections(userId: number, type?: string) {
  const db = await getDb();
  if (!db) return [];
  if (type) {
    return await db.select().from(financialProjections).where(
      and(
        eq(financialProjections.userId, userId),
        eq(financialProjections.type, type as any)
      )
    ).orderBy(financialProjections.projectionDate);
  }
  return await db.select().from(financialProjections).where(eq(financialProjections.userId, userId)).orderBy(financialProjections.projectionDate);
}

export async function saveProjection(projection: InsertFinancialProjection) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(financialProjections).values(projection);
  return result;
}

export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(alerts).values(alert);
  return result;
}
