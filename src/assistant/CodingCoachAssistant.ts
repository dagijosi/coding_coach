import type { ProgressSummary } from '@/types/progress';
import type { TopicMastery } from '@/learning/mastery/masteryTypes';
import type { WeakArea } from '@/learning/weakareas/weakAreaTypes';
import type { ConversationMessage } from '@/types/chat';

export type AssistantStatus = 'available' | 'unavailable';

export type AssistantContext = {
  currentLessonId: string;
  currentLessonTitle: string;
  topicName: string;
  progressSummary: ProgressSummary;
  topicMastery: TopicMastery[];
  weakAreas: WeakArea[];
  recentActivities: Array<{
    type: 'lesson' | 'problem' | 'challenge';
    id: string;
    title: string;
    completed: boolean;
    attemptedAt: string;
  }>;
  conversationHistory: ConversationMessage[];
};

export type AssistantResponse =
  | {
      status: 'success';
      content: string;
    }
  | {
      status: 'error';
      error: string;
    };

export interface CodingCoachAssistant {
  getStatus(): AssistantStatus;
  respond(context: AssistantContext): Promise<AssistantResponse>;
}
