// ---------------------------------------------------------------------------
// GitHub informational banners (offline / rate-limit / error).
// ---------------------------------------------------------------------------

import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui';
import {
  radius,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';
import type { GitHubErrorInfo } from '@/github/githubService';
import { lastSyncedText } from '../format';

/** Subtle note that the shown data comes from the last offline sync. */
export function GithubOfflineBanner({
  lastSyncAt,
}: {
  lastSyncAt: string | null | undefined;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.row, styles.offline]}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.text.muted} />
      <AppText variant="caption" muted>
        Offline — showing cached updates. {lastSyncedText(lastSyncAt)}.
      </AppText>
    </View>
  );
}

/** Shown when the GitHub API rate limit is exhausted. */
export function GithubRateLimitBanner({
  resetAtSeconds,
}: {
  resetAtSeconds: number | null;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const text = resetAtSeconds
    ? `GitHub API limit reached — new syncs resume ${new Date(
        resetAtSeconds * 1000
      ).toLocaleTimeString()}.`
    : 'GitHub API limit reached. Please sync again later.';
  return (
    <View style={[styles.row, styles.rate]}>
      <Ionicons name="alert-circle-outline" size={16} color={colors.status.warning} />
      <AppText variant="caption" style={{ color: colors.status.warning }}>
        {text}
      </AppText>
    </View>
  );
}

/** A transient status/error banner (rate-limit, network, etc.). */
export function GithubMessageBanner({
  error,
  onDismiss,
}: {
  error: GitHubErrorInfo;
  onDismiss?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const tone =
    error.kind === 'rate_limited' || error.kind === 'network'
      ? colors.status.warning
      : colors.status.error;
  return (
    <View style={[styles.row, { borderColor: tone }]}>
      <Ionicons
        name={error.retryable ? 'refresh-outline' : 'alert-circle-outline'}
        size={16}
        color={tone}
      />
      <AppText variant="caption" style={[styles.flex, { color: tone }]}>
        {error.message}
      </AppText>
      {onDismiss ? (
        <AppText
          variant="caption"
          style={{ color: tone, fontWeight: '700' }}
          onPress={onDismiss}
        >
          Dismiss
        </AppText>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    offline: {
      borderColor: colors.border.default,
      backgroundColor: colors.surface.secondary,
    },
    rate: {
      borderColor: colors.border.default,
      backgroundColor: hexWithAlpha(colors.status.warning, 0.08),
    },
    flex: { flex: 1 },
  });

function hexWithAlpha(hex: string, alpha: number): string {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}
