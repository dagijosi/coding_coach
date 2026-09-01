import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  Badge,
  Card,
  EmptyState,
  SkeletonCard,
} from '@/components/ui';
import {
  deleteConversation,
  getConversations,
  loadConversationHistory,
} from '@/services/conversationService';
import type { Conversation, ConversationMessage } from '@/types/chat';

import {
  radius,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';
import { hexWithAlpha } from '@/utils/color';
import { useToast } from '@/components/toast';

type ConversationItem = Conversation & {
  lastMessage?: string;
  messageCount: number;
};

export default function CoachHistoryScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const convs = await getConversations();
      const detailed: ConversationItem[] = [];

      for (const c of convs) {
        const msgs = await loadConversationHistory(c.id);
        const last = msgs[msgs.length - 1]?.content ?? '';
        detailed.push({
          ...c,
          lastMessage: last.replace(/<!--.*?-->/g, '').trim(),
          messageCount: msgs.length,
        });
      }

      setItems(detailed);
    } catch (e) {
      console.error('Failed to load conversation history:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this chat session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteConversation(id);
            showToast('Conversation deleted', 'info');
            loadData();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xs }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <AppText variant="h2">Coach Conversations</AppText>
          <AppText variant="caption" muted>
            Saved sessions and offline coaching history
          </AppText>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <SkeletonCard rows={2} />
          <SkeletonCard rows={2} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No chat history yet"
          message="Conversations with your AI Coach will be saved here automatically."
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card
              onPress={() => {
                router.back();
              }}
              style={styles.convCard}
            >
              <View style={styles.convRow}>
                <View
                  style={[
                    styles.convIconBox,
                    {
                      backgroundColor: hexWithAlpha(colors.accent.primary, 0.12),
                    },
                  ]}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color={colors.accent.primary}
                  />
                </View>

                <View style={styles.convInfo}>
                  <View style={styles.convTitleRow}>
                    <AppText variant="h3" style={styles.convTitle} numberOfLines={1}>
                      {item.title || 'Coaching Session'}
                    </AppText>
                    <Badge
                      label={`${item.messageCount} msg${item.messageCount === 1 ? '' : 's'}`}
                      variant="default"
                    />
                  </View>

                  <AppText variant="bodySmall" muted numberOfLines={2}>
                    {item.lastMessage || 'No messages'}
                  </AppText>

                  <AppText variant="caption" muted style={{ marginTop: 2 }}>
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </AppText>
                </View>

                <Pressable
                  onPress={() => handleDelete(item.id)}
                  hitSlop={8}
                  style={styles.deleteBtn}
                  accessibilityLabel="Delete conversation"
                >
                  <Ionicons name="trash-outline" size={18} color={colors.text.muted} />
                </Pressable>
              </View>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },

    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.secondary,
    },

    headerTitleWrap: {
      flex: 1,
    },

    loadingWrap: {
      padding: spacing.md,
    },

    listContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
    },

    convCard: {
      padding: spacing.md,
      borderRadius: radius.lg,
    },

    convRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },

    convIconBox: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },

    convInfo: {
      flex: 1,
      gap: 2,
    },

    convTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },

    convTitle: {
      flex: 1,
    },

    deleteBtn: {
      padding: spacing.xs,
      borderRadius: radius.sm,
      marginTop: 2,
    },
  });
