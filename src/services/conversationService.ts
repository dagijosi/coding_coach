import * as chatRepository from '@/repositories/chatRepository';
import type {
  Conversation,
  ConversationMessage,
  MessageRole,
} from '@/types/chat';

// ---------------------------------------------------------------------------
// Conversation lifecycle
// ---------------------------------------------------------------------------

export async function startConversation(
  title: string = ''
): Promise<Conversation> {
  return chatRepository.createConversation(title);
}

export async function addUserMessage(
  conversationId: string,
  content: string
): Promise<ConversationMessage> {
  return chatRepository.addMessage(
    conversationId,
    'user',
    content
  );
}

export async function addAssistantMessage(
  conversationId: string,
  content: string
): Promise<ConversationMessage> {
  return chatRepository.addMessage(
    conversationId,
    'assistant',
    content
  );
}

export async function addSystemMessage(
  conversationId: string,
  content: string
): Promise<ConversationMessage> {
  return chatRepository.addMessage(
    conversationId,
    'system',
    content
  );
}

export async function loadConversationHistory(
  conversationId: string
): Promise<ConversationMessage[]> {
  return chatRepository.getMessages(conversationId);
}

export async function getConversations(): Promise<Conversation[]> {
  return chatRepository.getConversations();
}

export async function getConversation(
  id: string
): Promise<Conversation | null> {
  return chatRepository.getConversation(id);
}

export async function updateConversationTitle(
  id: string,
  title: string
): Promise<void> {
  return chatRepository.updateConversationTitle(id, title);
}

export async function deleteConversation(
  id: string
): Promise<void> {
  return chatRepository.deleteConversation(id);
}
