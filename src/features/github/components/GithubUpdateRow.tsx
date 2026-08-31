// ---------------------------------------------------------------------------
// GitHub update row — a single commit or release in a detail list.
// ---------------------------------------------------------------------------

import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui';
import {
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';
import { relativeTime } from '../format';

export type GithubUpdateKind = 'commit' | 'release';

export function GithubUpdateRow({
  kind,
  title,
  subtitle,
  meta,
  body,
}: {
  kind: GithubUpdateKind;
  title: string;
  subtitle?: string | null;
  meta?: string;
  body?: string | null;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const tint = kind === 'commit' ? colors.status.info : colors.accent.secondary;
  const icon = kind === 'commit' ? 'git-commit-outline' : 'pricetag-outline';

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: hexWithAlpha(tint, 0.12) }]}>
        <Ionicons name={icon} size={17} color={tint} />
      </View>
      <View style={styles.flex}>
        <AppText variant="body" numberOfLines={2} style={{ fontWeight: '600' }}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" muted numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
        {body ? (
          <AppText variant="bodySmall" muted numberOfLines={2}>
            {body}
          </AppText>
        ) : null}
        {meta ? (
          <AppText variant="caption" muted>
            {meta}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

/** Formats a commit time string for a list row. */
export function formatCommitMeta(authorDate: string | null, authorName: string | null): string {
  const when = relativeTime(authorDate);
  const parts: string[] = [];
  if (when) parts.push(when);
  if (authorName) parts.push(authorName);
  return parts.join(' · ');
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
    },
  });

function hexWithAlpha(hex: string, alpha: number): string {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}
