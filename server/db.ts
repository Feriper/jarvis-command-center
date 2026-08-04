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
  alerts, InsertAlert
} from "../drizzle/schema";
import { ENV } from './_core/env';

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
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
}

export async function createConversation(conv: InsertConversation) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(conversations).values(conv);
  return result;
}

export async function getMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
}

export async function saveMessage(message: InsertChatMessage) {
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
