// ---------------------------------------------------------------------------
// GitHub repository row with a select/track toggle.
// ---------------------------------------------------------------------------

import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui';
import {
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';
import type { GitHubRepository } from '@/github/githubService';
import { compactCount, relativeTime } from '../format';

export function GithubRepoRow({
  repo,
  onToggle,
  onOpen,
}: {
  repo: GitHubRepository;
  onToggle: (selected: boolean) => void;
  onOpen: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.flex}>
        <AppText variant="body" numberOfLines={1} style={{ fontWeight: '600' }}>
          {repo.fullName}
        </AppText>
        <View style={styles.metaRow}>
          {repo.language ? (
            <View style={styles.metaItem}>
              <Ionicons name="code-slash-outline" size={13} color={colors.text.muted} />
              <AppText variant="caption" muted>
                {repo.language}
              </AppText>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Ionicons name="star-outline" size={13} color={colors.text.muted} />
            <AppText variant="caption" muted>
              {compactCount(repo.stars)}
            </AppText>
          </View>
          {repo.pushedAt ? (
            <AppText variant="caption" muted>
              · {relativeTime(repo.pushedAt)}
            </AppText>
          ) : null}
        </View>
      </View>

      <Switch
        value={repo.selected}
        onValueChange={onToggle}
        trackColor={{
          true: colors.status.success,
          false: colors.border.strong,
        }}
        thumbColor={colors.white}
      />
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
  });
