import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  FadeInView,
  LoadingState,
} from '@/components/ui';
import { TabScreen } from '@/components/navigation';

import { getProblems } from '@/repositories/problemRepository';
import { getLessons } from '@/repositories/lessonRepository';
import { getSolvedProblemIds } from '@/repositories/progressRepository';
import type { Problem } from '@/types/problem';
import { openProblem } from '@/utils/navigation';

import {
  radius,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';

type ProblemItem = Problem & {
  category: string;
  solved: boolean;
};

const DIFFICULTY_TINT: Record<Problem['difficulty'], 'success' | 'warning' | 'error'> = {
  beginner: 'success',
  easy: 'success',
  medium: 'warning',
  hard: 'error',
};

export default function PracticeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [items, setItems] = useState<ProblemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<DifficultyFilter>('all');

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const [problems, lessons, solvedIds] = await Promise.all([
        getProblems(),
        getLessons(),
        getSolvedProblemIds(),
      ]);

      const lessonTitles = new Map(
        lessons.map((lesson) => [lesson.id, lesson.title])
      );
      const solved = new Set(solvedIds);

      setItems(
        problems.map((problem) => ({
          ...problem,
          category:
            lessonTitles.get(problem.lessonId) ?? 'General',
          solved: solved.has(problem.id),
        }))
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      if (filter !== 'all' && item.difficulty !== filter) {
        return false;
      }
      if (
        q &&
        !(
          item.title.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      return true;
    });
  }, [items, query, filter]);

  if (loading) {
    return (
      <TabScreen>
        <ScreenHeader title="Practice" subtitle="Sharpen your skills with hands-on problems." />
        <LoadingState message="Loading problems..." />
      </TabScreen>
    );
  }

  if (error) {
    return (
      <TabScreen>
        <ScreenHeader title="Practice" subtitle="Sharpen your skills with hands-on problems." />
        <ErrorState title="Couldn't load problems" onRetry={load} />
      </TabScreen>
    );
  }

  return (
    <TabScreen>
      <ScreenHeader title="Practice" subtitle="Sharpen your skills with hands-on problems." />

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons
          name="search"
          size={18}
          color={colors.text.muted}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search problems..."
          placeholderTextColor={colors.text.muted}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.text.muted}
            />
          </Pressable>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.filters}>
        {(['all', 'easy', 'medium', 'hard'] as DifficultyFilter[]).map(
          (value) => (
            <FilterChip
              key={value}
              label={value === 'all' ? 'All' : capitalize(value)}
              active={filter === value}
              onPress={() => setFilter(value)}
            />
          )
        )}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No problems found"
          message="Try a different search or filter."
        />
      ) : (
        <View style={styles.list}>
          {filtered.map((item, index) => (
            <FadeInView key={item.id} distance={12}>
              <Card onPress={() => openProblem(item)}>
                <View style={styles.row}>
                  <View style={styles.icon}>
                    <Ionicons
                      name="code-slash-outline"
                      size={24}
                      color={colors.accent.primary}
                    />
                  </View>

                  <View style={styles.content}>
                    <View style={styles.titleRow}>
                      <AppText variant="h3" style={styles.title}>
                        {item.title}
                      </AppText>

                      {item.solved && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.status.success}
                        />
                      )}
                    </View>

                    <AppText
                      variant="bodySmall"
                      muted
                      numberOfLines={1}
                    >
                      {item.category}
                    </AppText>

                    <View style={styles.meta}>
                      <Badge
                        label={capitalize(item.difficulty)}
                        variant={DIFFICULTY_TINT[item.difficulty]}
                      />
                      <AppText variant="caption" muted>
                        {item.type.replace('-', ' ')}
                      </AppText>
                    </View>
                  </View>
                </View>
              </Card>
            </FadeInView>
          ))}
        </View>
      )}
    </TabScreen>
  );
}

function ScreenHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="h1">{title}</AppText>
      <AppText variant="bodySmall" muted>
        {subtitle}
      </AppText>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: colors.accent.primary },
      ]}
    >
      <AppText
        variant="caption"
        style={[
          styles.chipLabel,
          active && { color: colors.text.inverse },
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface.secondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      marginTop: spacing.lg,
    },

    searchInput: {
      flex: 1,
      color: colors.text.primary,
      paddingVertical: spacing.md,
      fontSize: 15,
    },

    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.md,
    },

    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    chipLabel: {
      color: colors.text.secondary,
      fontWeight: '600',
    },

    list: {
      gap: spacing.md,
      marginTop: spacing.lg,
    },

    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },

    icon: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface.secondary,
    },

    content: {
      flex: 1,
      gap: spacing.sm,
    },

    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },

    title: {
      flex: 1,
    },

    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.xs,
    },
  });
