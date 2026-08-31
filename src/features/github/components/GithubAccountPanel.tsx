// ---------------------------------------------------------------------------
// GitHub connected-account panel: identity + connection actions.
// ---------------------------------------------------------------------------

import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText, Badge, Button, Card } from '@/components/ui';
import {
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';
import type { GitHubAccount } from '@/github/githubService';
import { lastSyncedText } from '../format';

export function GithubAccountPanel({
  account,
  syncing,
  onSync,
  onDisconnect,
  onRefreshRepos,
}: {
  account: GitHubAccount;
  syncing: boolean;
  onSync: () => void;
  onDisconnect: () => void;
  onRefreshRepos: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const initial = (account.login || '?').charAt(0).toUpperCase();

  return (
    <Card>
      <View style={styles.identityRow}>
        {account.avatarUrl ? (
          null
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.accent.soft }]}>
            <AppText variant="h2" style={{ color: colors.accent.primary }}>
              {initial}
            </AppText>
          </View>
        )}
        <View style={styles.flex}>
          <AppText variant="h3">{account.name || account.login}</AppText>
          <AppText variant="caption" muted>
            @{account.login}
          </AppText>
        </View>
        <Badge label="Connected" variant="success" />
      </View>

      <AppText variant="caption" muted style={styles.syncMeta}>
        {lastSyncedText(account.lastSyncAt)}
      </AppText>

      <View style={styles.actions}>
        <View style={styles.flex}>
          <Button
            title={syncing ? 'Syncing…' : 'Sync now'}
            onPress={onSync}
            loading={syncing}
            disabled={syncing}
          />
        </View>
        <Button title="Repos" variant="secondary" onPress={onRefreshRepos} />
        <Button title="Disconnect" variant="danger" onPress={onDisconnect} />
      </View>
    </Card>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    identityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    syncMeta: {
      marginTop: spacing.sm,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
  });
