// ---------------------------------------------------------------------------
// Coach Screen (Phase 7 Step 6) — the chat UI.
//
// A polished, native-feeling chat experience over the existing offline
// CoachResponseEngine. This screen is purely presentational: every coaching
// decision (hints, explanations, context, actions) comes from useCoachChat,
// which delegates to the existing services. No SQL, no mastery math, no weak
// areas, no problem selection live here (§20).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui';
import {
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

import { useCoachChat } from '@/features/coach/useCoachChat';
import { CoachMessageBubble } from '@/features/coach/CoachMessageBubble';
import { CoachInputBar } from '@/features/coach/CoachInputBar';
import { CoachTypingIndicator } from '@/features/coach/CoachTypingIndicator';
import { CoachContextChip } from '@/features/coach/CoachContextChip';
import { CoachActionChips } from '@/features/coach/CoachActionChips';

const QUICK_ACTIONS = [
  {
    icon: 'bulb-outline' as const,
    label: 'Give me a hint',
    prompt: 'Give me a hint',
  },
  {
    icon: 'code-slash-outline' as const,
    label: 'Practice',
    prompt: 'What should I practice?',
  },
  {
    icon: 'trending-up-outline' as const,
    label: 'My progress',
    prompt: 'How am I doing?',
  },
  {
    icon: 'layers-outline' as const,
    label: 'Review concepts',
    prompt: 'Which concepts should I review?',
  },
];

export default function CoachScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [input, setInput] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const listRef = useRef<FlatList>(null);
  const nearBottomRef = useRef(true);
  const inputRef = useRef<TextInput>(null);

  const {
    messages,
    loading,
    loadError,
    sending,
    sendError,
    currentLesson,
    suggestedActions,
    retryLoad,
    send,
    clearConversation,
    runQuickAction,
    runAction,
  } = useCoachChat({
    onAction: handleSuggestedAction,
  });

  function handleSuggestedAction(action: {
    type: string;
    targetId: string;
    title: string;
  }) {
    switch (action.type) {
      case 'practice_problem':
      case 'retry_problem':
        if (action.targetId) router.push(`/problem/${action.targetId}`);
        else runQuickAction('Give me something to practice');
        break;
      case 'try_challenge':
        if (action.targetId) router.push(`/challenge/${action.targetId}`);
        else runQuickAction('Give me a challenge');
        break;
      case 'open_lesson':
      case 'continue_lesson':
        if (action.targetId) router.push(`/lesson/${action.targetId}`);
        else runQuickAction('Explain my current lesson');
        break;
      case 'review_concept':
        runQuickAction('Review my weak areas');
        break;
      case 'view_progress':
        router.push('/profile');
        break;
      default:
        break;
    }
  }

  // Keyboard listeners to keep the input visible (§13).
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (contentOffset.y + layoutMeasurement.height);
      nearBottomRef.current = distanceFromBottom < 80;
    },
    []
  );

  const scrollToEnd = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated });
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      if (nearBottomRef.current) {
        scrollToEnd(false);
      }
    }
  }, [messages.length, sending, scrollToEnd]);

  const handleSend = useCallback(
    async (text: string) => {
      setInput('');
      const ok = await send(text);
      if (!ok) {
        // Keep the input text so the learner can retry without retyping.
        setInput(text);
      }
    },
    [send]
  );

  const handleClear = useCallback(async () => {
    await clearConversation();
    setInput('');
  }, [clearConversation]);

  const footerInset = keyboardHeight > 0 ? 0 : insets.bottom;

  if (loading) {
    return (
      <ChatRoot padTop={insets.top} padBottom={footerInset}>
        <CoachHeader
          onClear={handleClear}
          hasMessages={false}
        />
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent.primary} />
          <AppText variant="bodySmall" muted>
            Loading your conversation...
          </AppText>
        </View>
      </ChatRoot>
    );
  }

  if (loadError) {
    return (
      <ChatRoot padTop={insets.top} padBottom={footerInset}>
        <CoachHeader onClear={handleClear} hasMessages={messages.length > 0} />
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={40}
            color={colors.text.muted}
          />
          <AppText variant="h3">Couldn't load your chat</AppText>
          <AppText variant="bodySmall" muted style={styles.centerText}>
            Check the database and try again.
          </AppText>
          <Pressable
            onPress={retryLoad}
            style={styles.retry}
            accessibilityRole="button"
          >
            <AppText variant="body" style={{ color: colors.accent.primary, fontWeight: '600' }}>
              Retry
            </AppText>
          </Pressable>
        </View>
      </ChatRoot>
    );
  }

  const isEmpty = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ChatRoot padTop={insets.top} padBottom={footerInset}>
        <CoachHeader
          onClear={handleClear}
          hasMessages={messages.length > 0}
        />

        <CoachContextChip lesson={currentLesson} />

        {isEmpty ? (
          <CoachEmptyState onQuick={runQuickAction} />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <MessageRow
                item={item}
                showTimestamp={
                  index === 0 ||
                  item.role !== messages[index - 1]?.role
                }
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onScroll={onScroll}
            scrollEventThrottle={32}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              <View style={styles.footerArea}>
                {sending ? <CoachTypingIndicator /> : null}
                {!sending && suggestedActions.length > 0 ? (
                  <View style={styles.suggested}>
                    <AppText variant="caption" muted>
                      You can also:
                    </AppText>
                    <CoachActionChips
                      variant="suggested"
                      items={suggestedActions}
                      onAction={runAction}
                    />
                  </View>
                ) : null}
                {sendError ? (
                  <AppText
                    variant="caption"
                    style={{ color: colors.status.error, textAlign: 'center' }}
                    accessibilityRole="alert"
                  >
                    Something went wrong. Your message wasn't answered — try again.
                  </AppText>
                ) : null}
                <View style={styles.endPadder} />
              </View>
            }
          />
        )}

        <CoachInputBar
          ref={inputRef}
          value={input}
          onChangeText={setInput}
          onSend={handleSend}
          sending={sending}
        />
      </ChatRoot>
    </KeyboardAvoidingView>
  );
}

function MessageRow({
  item,
  showTimestamp,
}: {
  item: { role: 'user' | 'assistant' | 'system'; text: string; raw: { createdAt: string } };
  showTimestamp: boolean;
}) {
  const padding = useMemo(() => (item.role === 'user' ? 4 : 8), [item.role]);
  return (
    <View style={{ paddingHorizontal: spacing.xs, marginVertical: Math.max(2, padding / 2) }}>
      <CoachMessageBubble
        role={item.role}
        text={item.text}
        showTimestamp={showTimestamp}
        timestamp={item.raw.createdAt}
      />
    </View>
  );
}

function CoachHeader({
  onClear,
  hasMessages,
}: {
  onClear: () => void;
  hasMessages: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.header}>
      <View style={styles.headerTitle}>
        <View style={[styles.headerIcon, { backgroundColor: colors.accent.soft }]}>
          <Ionicons name="chatbubbles-outline" size={18} color={colors.accent.primary} />
        </View>
        <View>
          <AppText variant="h3">Coach</AppText>
          <AppText variant="caption" muted>
            Always available, fully offline
          </AppText>
        </View>
      </View>

      {hasMessages && (
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            onClear();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Start a new conversation"
          style={styles.clear}
        >
          <Ionicons name="add-circle-outline" size={22} color={colors.text.secondary} />
        </Pressable>
      )}
    </View>
  );
}

function CoachEmptyState({ onQuick }: { onQuick: (prompt: string) => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.accent.soft }]}>
        <Ionicons name="sparkles" size={30} color={colors.accent.primary} />
      </View>
      <AppText variant="h2" style={styles.emptyTitle}>
        How can I help you learn today?
      </AppText>
      <AppText variant="bodySmall" muted style={styles.emptySub}>
        Ask about a concept, get a hint, or decide what to practice next.
      </AppText>
      <CoachActionChips
        variant="quick"
        items={QUICK_ACTIONS}
        onQuick={onQuick}
      />
    </View>
  );
}

function ChatRoot({
  children,
  padTop,
  padBottom,
}: {
  children: React.ReactNode;
  padTop: number;
  padBottom: number;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.root, { paddingTop: padTop + spacing.sm, paddingBottom: padBottom }]}>
      {children}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },
    keyboard: {
      flex: 1,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    headerTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clear: {
      width: 40,
      height: 40,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },

    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    centerText: {
      textAlign: 'center',
    },
    retry: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 14,
      marginTop: spacing.sm,
      backgroundColor: colors.surface.secondary,
    },

    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.lg,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: {
      textAlign: 'center',
    },
    emptySub: {
      textAlign: 'center',
      marginBottom: spacing.sm,
    },

    listContent: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexGrow: 1,
    },
    footerArea: {
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    suggested: {
      gap: spacing.sm,
      marginVertical: spacing.xs,
    },
    endPadder: {
      height: spacing.sm,
    },
  });
