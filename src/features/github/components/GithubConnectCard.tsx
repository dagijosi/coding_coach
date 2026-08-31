// ---------------------------------------------------------------------------
// GitHub connect card (disconnected state).
// ---------------------------------------------------------------------------

import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText, Button, Card } from '@/components/ui';
import {
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';
import type { GitHubErrorInfo } from '@/github/githubService';

export function GithubConnectCard({
  connecting,
  error,
  renderedByCoach,
  onConnect,
}: {
  connecting: boolean;
  error: GitHubErrorInfo | null;
  renderedByCoach?: boolean;
  onConnect: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const isNotConfigured = error?.kind === 'not_configured';

  return (
    <Card>
      <View style={styles.iconRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accent.soft }]}>
          <Ionicons name="logo-github" size={30} color={colors.accent.primary} />
        </View>
        <View style={styles.flex}>
          <AppText variant="h3">Connect GitHub</AppText>
          <AppText variant="caption" muted>
            Track repos, commits &amp; releases offline
          </AppText>
        </View>
      </View>

      <AppText variant="bodySmall" muted style={styles.body}>
        {renderedByCoach
          ? 'Link your GitHub to let your Coach summarise your recent coding activity.'
          : 'Connect your GitHub account to sync your repositories, commits and releases into an offline activity feed. Nothing is ever pushed to GitHub — this is read-only.'}
      </AppText>

      {isNotConfigured ? (
        <View
          style={[styles.notice, { borderColor: colors.border.strong }]}
        >
          <AppText variant="bodySmall" muted>
            <AppText variant="bodySmall" style={{ fontWeight: '700' }}>
              This build needs one manual step before connecting:
            </AppText>{' '}
            A maintainer must register a GitHub OAuth App with Device Flow
            enabled and put its public <AppText variant="bodySmall" style={{ fontFamily: 'monospace' }}>client_id</AppText> in the app config
            (<AppText variant="bodySmall" style={{ fontFamily: 'monospace' }}>extra.githubClientId</AppText>). No secret or backend is required —
            only the public client id.
          </AppText>
        </View>
      ) : null}

      {error && !isNotConfigured ? (
        <AppText
          variant="caption"
          style={[styles.error, { color: colors.status.error }]}
        >
          {error.message}
        </AppText>
      ) : null}

      <Button
        title={connecting ? 'Connecting…' : 'Connect with GitHub'}
        onPress={onConnect}
        loading={connecting}
        disabled={connecting}
      />
    </Card>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    iconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      marginBottom: spacing.md,
    },
    notice: {
      borderWidth: 1,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    error: {
      marginBottom: spacing.md,
    },
  });
