import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Badge, Card, EmptyState } from '@/components/ui';
import { getLessons } from '@/repositories/lessonRepository';
import { getChallenges } from '@/repositories/challengeRepository';
import { getTopics } from '@/repositories/topicRepository';
import type { Lesson } from '@/types/lesson';
import type { Challenge, Topic } from '@/types/learning';

import {
  radius,
  shadows,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';
import { hexWithAlpha } from '@/utils/color';

type SearchFilter = 'all' | 'lessons' | 'challenges' | 'topics';

type SearchResultItem = {
  type: 'lesson' | 'challenge' | 'topic';
  id: string;
  title: string;
  description: string;
  language?: string;
  difficulty?: string;
  topicName?: string;
};

export default function SearchScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getLessons(), getChallenges(), getTopics()])
      .then(([ls, chs, tps]) => {
        setLessons(ls);
        setChallenges(chs);
        setTopics(tps);
      })
      .catch((e) => {
        console.error('Failed to load search index:', e);
      })
      .finally(() => setLoading(false));
  }, []);

  const topicMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of topics) {
      map.set(t.id, t.name);
    }
    return map;
  }, [topics]);

  const lessonMap = useMemo(() => {
    const map = new Map<string, Lesson>();
    for (const l of lessons) {
      map.set(l.id, l);
    }
    return map;
  }, [lessons]);

  const allItems = useMemo<SearchResultItem[]>(() => {
    const list: SearchResultItem[] = [];

    for (const l of lessons) {
      list.push({
        type: 'lesson',
        id: l.id,
        title: l.title,
        description: l.description,
        language: l.language,
        difficulty: l.difficulty,
        topicName: l.topicId ? topicMap.get(l.topicId) : undefined,
      });
    }

    for (const c of challenges) {
      const parentLesson = lessonMap.get(c.lessonId);
      list.push({
        type: 'challenge',
        id: c.id,
        title: c.title,
        description: c.description,
        language: parentLesson?.language,
        difficulty: c.difficulty,
        topicName: parentLesson?.topicId ? topicMap.get(parentLesson.topicId) : undefined,
      });
    }

    for (const t of topics) {
      list.push({
        type: 'topic',
        id: t.id,
        title: t.name,
        description: t.description,
      });
    }

    return list;
  }, [lessons, challenges, topics, topicMap, lessonMap]);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return allItems.filter((item) => {
      if (filter === 'lessons' && item.type !== 'lesson') return false;
      if (filter === 'challenges' && item.type !== 'challenge') return false;
      if (filter === 'topics' && item.type !== 'topic') return false;

      const titleMatch = item.title.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const langMatch = item.language?.toLowerCase().includes(q);
      const topicMatch = item.topicName?.toLowerCase().includes(q);

      return titleMatch || descMatch || langMatch || topicMatch;
    });
  }, [allItems, query, filter]);

  const handleSelectItem = useCallback((item: SearchResultItem) => {
    if (item.type === 'lesson') {
      router.push(`/lesson/${item.id}`);
    } else if (item.type === 'challenge') {
      router.push(`/challenge/${item.id}`);
    } else {
      router.push('/learn');
    }
  }, []);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.xs }]}>
      {/* Search Header Bar */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </Pressable>

        <View style={styles.searchInputWrap}>
          <Ionicons name="search" size={18} color={colors.accent.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search lessons, challenges, concepts..."
            placeholderTextColor={colors.text.muted}
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.text.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(
          [
            { id: 'all', label: 'All' },
            { id: 'lessons', label: 'Lessons' },
            { id: 'challenges', label: 'Challenges' },
            { id: 'topics', label: 'Topics' },
          ] as const
        ).map((tab) => {
          const active = filter === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setFilter(tab.id)}
              style={[
                styles.filterChip,
                active && styles.filterChipActive,
              ]}
            >
              <AppText
                variant="caption"
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Results / Empty state */}
      {!query.trim() ? (
        <View style={styles.emptyPrompt}>
          <Ionicons name="search-outline" size={48} color={colors.accent.secondary} />
          <AppText variant="h3" style={{ marginTop: spacing.sm }}>
            Global Search
          </AppText>
          <AppText variant="bodySmall" muted style={{ textAlign: 'center', maxWidth: 280 }}>
            Find coding lessons, interactive practice problems, and programming concepts.
          </AppText>

          <View style={styles.suggestedSearches}>
            <AppText variant="caption" muted style={{ fontWeight: '700' }}>
              POPULAR SEARCHES:
            </AppText>
            <View style={styles.suggestedGrid}>
              {['Variables', 'Functions', 'Loops', 'Arrays', 'Python', 'TypeScript'].map(
                (term) => (
                  <Pressable
                    key={term}
                    onPress={() => setQuery(term)}
                    style={styles.suggestedChip}
                  >
                    <Ionicons name="flash-outline" size={12} color={colors.accent.primary} />
                    <AppText variant="caption" style={{ fontWeight: '600' }}>
                      {term}
                    </AppText>
                  </Pressable>
                )
              )}
            </View>
          </View>
        </View>
      ) : filteredResults.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No results found"
          message={`No matches found for "${query}". Try different keywords.`}
        />
      ) : (
        <FlatList
          data={filteredResults}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card
              onPress={() => handleSelectItem(item)}
              style={styles.resultCard}
            >
              <View style={styles.resultRow}>
                <View
                  style={[
                    styles.resultIconBox,
                    {
                      backgroundColor:
                        item.type === 'lesson'
                          ? hexWithAlpha(colors.accent.primary, 0.12)
                          : item.type === 'challenge'
                          ? hexWithAlpha(colors.status.warning, 0.12)
                          : hexWithAlpha(colors.status.info, 0.12),
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      item.type === 'lesson'
                        ? 'book-outline'
                        : item.type === 'challenge'
                        ? 'code-slash'
                        : 'layers-outline'
                    }
                    size={20}
                    color={
                      item.type === 'lesson'
                        ? colors.accent.primary
                        : item.type === 'challenge'
                        ? colors.status.warning
                        : colors.status.info
                    }
                  />
                </View>

                <View style={styles.resultInfo}>
                  <View style={styles.resultTitleRow}>
                    <AppText variant="h3" style={styles.resultTitle} numberOfLines={1}>
                      {item.title}
                    </AppText>
                    {item.difficulty ? (
                      <Badge
                        label={item.difficulty.toUpperCase()}
                        variant={
                          item.difficulty === 'hard'
                            ? 'error'
                            : item.difficulty === 'medium'
                            ? 'warning'
                            : 'success'
                        }
                      />
                    ) : null}
                  </View>

                  <AppText variant="bodySmall" muted numberOfLines={2}>
                    {item.description}
                  </AppText>

                  <View style={styles.resultMetaRow}>
                    <Badge
                      label={item.type.toUpperCase()}
                      variant="default"
                    />
                    {item.language ? (
                      <AppText variant="caption" muted>
                        • {item.language.toUpperCase()}
                      </AppText>
                    ) : null}
                    {item.topicName ? (
                      <AppText variant="caption" muted numberOfLines={1}>
                        • {item.topicName}
                      </AppText>
                    ) : null}
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color={colors.text.muted} />
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

    searchInputWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.xl,
      backgroundColor: colors.surface.primary,
      borderWidth: 1,
      borderColor: colors.border.default,
      ...shadows.small,
    },

    searchInput: {
      flex: 1,
      color: colors.text.primary,
      fontSize: 14,
      paddingVertical: 2,
    },

    filterRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },

    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
      borderColor: 'transparent',
    },

    filterChipActive: {
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.14),
      borderColor: colors.accent.primary,
    },

    filterChipText: {
      color: colors.text.secondary,
      fontWeight: '600',
      fontSize: 12,
    },

    filterChipTextActive: {
      color: colors.accent.primary,
      fontWeight: '700',
    },

    listContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
    },

    resultCard: {
      padding: spacing.md,
      borderRadius: radius.lg,
    },

    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },

    resultIconBox: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },

    resultInfo: {
      flex: 1,
      gap: 3,
    },

    resultTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },

    resultTitle: {
      flex: 1,
    },

    resultMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },

    emptyPrompt: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.xs,
      paddingBottom: spacing.xxl,
    },

    suggestedSearches: {
      marginTop: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },

    suggestedGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.xs,
    },

    suggestedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
      borderColor: colors.border.default,
    },
  });
