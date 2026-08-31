// ---------------------------------------------------------------------------
// useCoachChat — controller layer for the Chat screen (Phase 7 Step 6).
//
// This hook owns ALL conversation behavior so the screen stays presentational:
//   - loads the persisted conversation on mount (Step 9)
//   - runs the send pipeline: save user -> respondToRequest -> save assistant
//   - strips hint-progression marker lines (Step 6 / persistenceBody)
//   - exposes quick + suggested actions that drive the existing request system
//   - guards against duplicate sends and exposes loading/error state
//
// It delegates every brain decision to the existing services:
//   respondToRequest (CoachResponseEngine), conversationService, and the
//   session store for the current lesson location.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  addAssistantMessage,
  addUserMessage,
  deleteConversation,
  getConversations,
  loadConversationHistory,
  startConversation,
} from '@/services/conversationService';
import {
  respondToRequest,
  persistenceBody,
} from '@/learning/coach/coachService';
import type { CoachResponse } from '@/learning/coach/coachTypes';
import type { ConversationMessage, MessageRole } from '@/types/chat';
import { useSessionStore } from '@/store/sessionStore';
import type { AssistantContext } from '@/assistant/CodingCoachAssistant';
import {
  isUsableMessage,
  enginePromptForAction,
  stripHintMarker,
} from './chatContent';

export type ChatMessage = {
  id: string;
  role: MessageRole;
  /** Marker-stripped text shown in the bubble. */
  text: string;
  /** Raw persisted record (unmodified) kept for reference. */
  raw: ConversationMessage;
};

export type CoachActionHandler = (action: {
  type: string;
  targetId: string;
  title: string;
}) => void;

type UseCoachChatOptions = {
  /** Called when a suggested action should navigate/render (UI layer). */
  onAction?: CoachActionHandler;
};

export function useCoachChat({ onAction }: UseCoachChatOptions = {}) {
  const currentLesson = useSessionStore((s) => s.currentLesson);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [suggestedActions, setSuggestedActions] = useState<
    CoachResponse['actions']
  >([]);

  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const conversationIdRef = useRef<string | null>(null);
  const sendingRef = useRef(false);

  /** Strips the machine-readable hint marker so only text is rendered. */
  const stripMarker = useCallback(
    (content: string): string => stripHintMarker(content),
    []
  );

  const toChatMessage = useCallback(
    (m: ConversationMessage): ChatMessage => ({
      id: m.id,
      role: m.role,
      text: stripMarker(m.content),
      raw: m,
    }),
    [stripMarker]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const conversations = await getConversations();
      const target = conversations[0] ?? null;
      if (target) {
        conversationIdRef.current = target.id;
        setConversationId(target.id);
        const history = await loadConversationHistory(target.id);
        setMessages(history.map(toChatMessage));
      } else {
        conversationIdRef.current = null;
        setConversationId(null);
        setMessages([]);
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [toChatMessage]);

  useEffect(() => {
    load();
  }, [load]);

  const ensureConversation = useCallback(async (): Promise<string> => {
    if (conversationIdRef.current) {
      return conversationIdRef.current;
    }
    const created = await startConversation('Coding Coach');
    conversationIdRef.current = created.id;
    setConversationId(created.id);
    return created.id;
  }, []);

  const buildContext = useCallback((): AssistantContext => {
    return {
      currentLessonId: currentLesson?.id ?? '',
      currentLessonTitle: currentLesson?.title ?? '',
      topicName: '',
      progressSummary: {} as AssistantContext['progressSummary'],
      topicMastery: [],
      weakAreas: [],
      recentActivities: [],
      conversationHistory: [],
    };
  }, [currentLesson]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!isUsableMessage(text)) return false;
      if (sendingRef.current) return false;
      sendingRef.current = true;
      setSending(true);
      setSendError(false);

      const historyForEngine = messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.raw.content,
      }));

      try {
        const convId = await ensureConversation();
        const savedUser = await addUserMessage(convId, text);
        setMessages((prev) => [...prev, toChatMessage(savedUser)]);

        const response: CoachResponse = await respondToRequest(
          buildContext(),
          text,
          historyForEngine
        );

        const body = persistenceBody(
          response,
          response.relatedProblem?.id ?? null
        );
        const savedAssistant = await addAssistantMessage(convId, body);
        setMessages((prev) => [...prev, toChatMessage(savedAssistant)]);

        if (response.actions.length > 0) {
          setSuggestedActions(response.actions);
        }
        return true;
      } catch {
        setSendError(true);
        return false;
      } finally {
        sendingRef.current = false;
        setSending(false);
      }
    },
    [messages, ensureConversation, buildContext, toChatMessage]
  );

  const clearConversation = useCallback(async () => {
    const id = conversationIdRef.current;
    if (id) {
      try {
        await deleteConversation(id);
      } catch {
        // Best effort — reloading still resets local state.
      }
    }
    conversationIdRef.current = null;
    setConversationId(null);
    setMessages([]);
    setSuggestedActions([]);
    setSendError(false);
  }, []);

  const runQuickAction = useCallback(
    async (prompt: string) => {
      await send(prompt);
    },
    [send]
  );

  const runAction = useCallback(
    (action: { type: string; targetId: string; title: string }) => {
      // Requests that belong to the coach engine round-trip through it.
      const prompt = enginePromptForAction(action);
      if (prompt) {
        runQuickAction(prompt);
        return;
      }
      // Navigation/UI actions are handled by the screen.
      onActionRef.current?.(action);
    },
    [runQuickAction]
  );

  return {
    messages,
    loading,
    loadError,
    sending,
    sendError,
    conversationId,
    currentLesson,
    suggestedActions,
    retryLoad: load,
    send,
    clearConversation,
    runQuickAction,
    runAction,
  };
}
