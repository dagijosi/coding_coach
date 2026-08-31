// ---------------------------------------------------------------------------
// GitHub screen (Phase 8) — connect, sync, and browse offline GitHub updates.
//
// This screen is presentational: all connection + sync behavior is owned by
// useGitHubHub, which delegates to the GitHub application service. The UI never
// calls the GitHub API or SQLite directly.
// ---------------------------------------------------------------------------

import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import {
  AppText,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
} from '@/components/ui';
import {
  GithubConnectCard,
  GithubDeviceFlowCard,
  GithubAccountPanel,
  GithubOfflineBanner,
  GithubRateLimitBanner,
  GithubMessageBanner,
  GithubRepoRow,
  GithubScreenHeader,
} from '@/features/github/components';
import { useGitHubHub } from '@/features/github/useGitHubHub';
import {
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

export default function GitHubScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const {
    connection,
    account,
    updates,
    syncing,
    rateLimited,
    deviceFlow,
    connectError,
    banner,
    connect,
    cancelConnect,
    disconnect,
    syncNow,
    toggleRepo,
    refreshRepos,
    clearBanner,
  } = useGitHubHub();

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  }, []);

  if (connection === 'loading') {
    return (
      <Screen scroll={false}>
        <GithubScreenHeader title="GitHub" subtitle="Offline activity" onBack={goBack} />
        <LoadingState full message="Loading GitHub…" />
      </Screen>
    );
  }

  const isProvisional =
    connection === 'disconnected' || connection === 'connecting' || connection === 'error';

  return (
    <Screen>
      <GithubScreenHeader
        title="GitHub"
        subtitle={isProvisional ? 'Connect to get started' : 'Offline activity'}
        onBack={goBack}
      />

      <View style={styles.section}>
        {connection === 'disconnected' ? (
          <>
            <SectionHeader
              title="Connect your GitHub"
              subtitle="Read-only. Nothing is pushed to GitHub."
              icon="logo-github"
            />
            <GithubConnectCard
              connecting={false}
              error={connectError}
              onConnect={connect}
            />
          </>
        ) : null}

        {connection === 'connecting' && deviceFlow ? (
          <GithubDeviceFlowCard flow={deviceFlow} onCancel={cancelConnect} />
        ) : null}

        {connection === 'error' ? (
          <GithubConnectCard
            connecting={false}
            error={connectError ?? {
              kind: 'unknown',
              message: 'Could not connect to GitHub.',
              retryable: true,
            }}
            onConnect={connect}
          />
        ) : null}

        {connection === 'connected' && account ? (
          <>
            <GithubAccountPanel
              account={account}
              syncing={syncing}
              onSync={syncNow}
              onDisconnect={disconnect}
              onRefreshRepos={refreshRepos}
            />

            <View style={styles.banners}>
              {rateLimited ? (
                <GithubRateLimitBanner
                  resetAtSeconds={updates?.syncState?.rateLimitResetAt ?? null}
                />
              ) : null}
              {banner ? (
                <GithubMessageBanner error={banner} onDismiss={clearBanner} />
              ) : null}
              <GithubOfflineBanner lastSyncAt={account.lastSyncAt} />
            </View>

            <RecentActivitySection />
            <TrackedReposSection onToggleRepo={toggleRepo} />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function RecentActivitySection() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { updates } = useGitHubHub();

  const commits = updates?.commits ?? [];
  const releases = updates?.releases ?? [];
  const items = [
    ...commits.map((c) => ({
      key: `c:${c.id}`,
      kind: 'commit' as const,
      title: c.message.split('\n')[0],
      subtitle: c.repoId,
      meta: `${relative(c.authorDate)} · ${c.authorName ?? 'unknown'}`,
      body: undefined,
      onOpen: () => openRepoDetail(c.repoId),
    })),
    ...releases.map((r) => ({
      key: `r:${r.id}`,
      kind: 'release' as const,
      title: r.tagName,
      subtitle: r.repoId,
      meta: relative(r.publishedAt),
      body: r.name ?? undefined,
      onOpen: () => openRepoDetail(r.repoId),
    })),
  ]
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 12);

  const hasItems = items.length > 0;

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Recent activity"
        subtitle="From your last offline sync."
        icon="time-outline"
      />
      <Card>
        {!hasItems ? (
          <AppText variant="bodySmall" muted>
            No cached activity yet — tap &quot;Sync now&quot; to pull your recent
            commits and releases.
          </AppText>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <RepoMiniRow
                key={item.key}
                kind={item.kind}
                title={item.title}
                subtitle={item.subtitle}
                meta={item.meta}
                body={item.body}
                onOpen={item.onOpen}
              />
            ))}
          </View>
        )}
      </Card>
    </View>
  );
}

function RepoMiniRow({
  kind,
  title,
  subtitle,
  meta,
  body,
  onOpen,
}: {
  kind: 'commit' | 'release';
  title: string;
  subtitle: string;
  meta: string;
  body?: string;
  onOpen: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const tint = kind === 'commit' ? colors.status.info : colors.accent.secondary;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <View style={[styles.miniIcon, { backgroundColor: hexWithAlpha(tint, 0.12) }]}>
        <AppText variant="caption" style={{ color: tint, fontWeight: '700' }}>
          {kind === 'commit' ? '▲' : '◆'}
        </AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="bodySmall" numberOfLines={1} style={{ fontWeight: '600' }}>
          {title}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {subtitle} · {meta}
        </AppText>
        {body ? (
          <AppText variant="caption" muted numberOfLines={1}>
            {body}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

function TrackedReposSection({
  onToggleRepo,
}: {
  onToggleRepo: (fullName: string, selected: boolean) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useTheme();
  const { updates } = useGitHubHub();
  const repos = updates?.repositories ?? [];

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Tracking"
        subtitle="Tap a repository to see its commits & releases."
        icon="git-branch-outline"
        actionLabel={repos.length > 0 ? `${repos.filter((r) => r.selected).length} tracked` : undefined}
      />
      {repos.length === 0 ? (
        <Card>
          <EmptyState
            icon="git-network-outline"
            title="No repositories yet"
            message="Sync now to load your repositories, then toggle the ones you want to track."
          />
        </Card>
      ) : (
        <Card>
          <View style={{ gap: spacing.sm }}>
            {repos.map((repo) => (
              <GithubRepoRow
                key={repo.fullName}
                repo={repo}
                onToggle={(sel) => onToggleRepo(repo.fullName, sel)}
                onOpen={() => openRepoDetail(repo.fullName)}
              />
            ))}
          </View>
        </Card>
      )}
    </View>
  );
}

function openRepoDetail(fullName: string) {
  const idx = fullName.indexOf('/');
  const owner = idx === -1 ? fullName : fullName.slice(0, idx);
  const name = idx === -1 ? fullName : fullName.slice(idx + 1);
  router.push(`/github/repository/${owner}/${name}`);
}

function relative(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const d = new Date(iso).getTime();
    if (Number.isNaN(d)) return '';
    const s = Math.floor((Date.now() - d) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const day = Math.floor(h / 24);
    if (day < 7) return `${day}d ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return '';
  }
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    banners: {
      gap: spacing.sm,
    },
    list: {
      gap: spacing.md,
    },
    miniIcon: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

function hexWithAlpha(hex: string, alpha: number): string {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
}
