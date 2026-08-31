import { getDatabase } from '@/database';
import type {
  Conversation,
  ConversationMessage,
  MessageRole,
} from '@/types/chat';

function generateId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function nowISO(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export async function createConversation(
  title: string = ''
): Promise<Conversation> {
  const db = await getDatabase();
  const id = generateId();
  const timestamp = nowISO();

  await db.runAsync(
    `INSERT INTO conversations (id, title, created_at, updated_at)
     VALUES (?, ?, ?, ?)`,
    id,
    title,
    timestamp,
    timestamp
  );

  return { id, title, createdAt: timestamp, updatedAt: timestamp };
}

export async function getConversation(
  id: string
): Promise<Conversation | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, title, created_at, updated_at
     FROM conversations WHERE id = ?`,
    id
  );

  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getConversations(): Promise<Conversation[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT id, title, created_at, updated_at
     FROM conversations
     ORDER BY updated_at DESC`
  );

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

export async function updateConversationTitle(
  id: string,
  title: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE conversations
     SET title = ?, updated_at = ?
     WHERE id = ?`,
    title,
    nowISO(),
    id
  );
}

export async function deleteConversation(
  id: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM conversations WHERE id = ?`,
    id
  );
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function addMessage(
  conversationId: string,
  role: MessageRole,
  content: string
): Promise<ConversationMessage> {
  const db = await getDatabase();
  const id = generateId();
  const timestamp = nowISO();

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      `INSERT INTO conversation_messages
         (id, conversation_id, role, content, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      id,
      conversationId,
      role,
      content,
      timestamp
    );
    await txn.runAsync(
      `UPDATE conversations
       SET updated_at = ?
       WHERE id = ?`,
      timestamp,
      conversationId
    );
  });

  return {
    id,
    conversationId,
    role,
    content,
    createdAt: timestamp,
  };
}

export async function getMessages(
  conversationId: string
): Promise<ConversationMessage[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    conversation_id: string;
    role: string;
    content: string;
    created_at: string;
  }>(
    `SELECT id, conversation_id, role, content, created_at
     FROM conversation_messages
     WHERE conversation_id = ?
     ORDER BY created_at ASC`,
    conversationId
  );

  return rows.map((r) => ({
    id: r.id,
    conversationId: r.conversation_id,
    role: r.role as MessageRole,
    content: r.content,
    createdAt: r.created_at,
  }));
}
