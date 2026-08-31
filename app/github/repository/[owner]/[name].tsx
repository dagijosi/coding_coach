// ---------------------------------------------------------------------------
// GitHub repository detail screen (Phase 8).
//
// Offline view of a single tracked repo's cached commits and releases. Reads go
// through the application service (getRepositoryDetail), never the API directly.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import {
  AppText,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SectionHeader,
} from '@/components/ui';
import { getRepositoryDetail } from '@/github/githubService';
import {
  GithubOfflineBanner,
  GithubScreenHeader,
  GithubUpdateRow,
} from '@/features/github/components';
import {
  compactCount,
  repoName,
} from '@/features/github/format';
import {
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';
import type {
  GitHubCommit,
  GitHubRelease,
  GitHubRepository,
} from '@/github/githubService';

export default function GithubRepositoryDetailScreen() {
  const params = useLocalSearchParams<{ owner: string; name: string }>();
  const owner = params.owner ?? '';
  const name = params.name ?? '';
  const fullName = owner ? `${owner}/${name}` : '';

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [repo, setRepo] = useState<GitHubRepository | null>(null);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const detail = await getRepositoryDetail(fullName);
      setRepo(detail.repository);
      setCommits(detail.commits);
      setReleases(detail.releases);
      setLoadError(null);
    } catch {
      setLoadError('Could not load repository data.');
    } finally {
      setLoaded(true);
    }
  }, [fullName]);

  useEffect(() => {
    load();
  }, [load]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/github');
    }
  }, []);

  if (!loaded) {
    return (
      <Screen scroll={false}>
        <GithubScreenHeader title={repoName(fullName)} onBack={goBack} />
        <LoadingState full message="Loading repository…" />
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen scroll={false}>
        <GithubScreenHeader title={repoName(fullName)} onBack={goBack} />
        <ErrorState
          title="Could not load"
          message={loadError}
          onRetry={load}
        />
      </Screen>
    );
  }

  if (!repo) {
    return (
      <Screen scroll={false}>
        <GithubScreenHeader title={repoName(fullName)} onBack={goBack} />
        <EmptyState
          icon="git-network-outline"
          title="Repository not tracked"
          message="This repository is not in your local cache yet. Go back, make sure it is tracked, and sync."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <GithubScreenHeader
        title={repoName(fullName)}
        subtitle={`${repo.owner}/${repo.name}`}
        onBack={goBack}
      />

      <View style={styles.section}>
        <Card>
          {repo.description ? (
            <AppText variant="bodySmall" muted>
              {repo.description}
            </AppText>
          ) : null}
          <AppText variant="caption" muted style={styles.repoMeta}>
            {[
              repo.language,
              repo.stars > 0 ? `${compactCount(repo.stars)} stars` : null,
              repo.forks > 0 ? `${compactCount(repo.forks)} forks` : null,
              repo.defaultBranch ? `default: ${repo.defaultBranch}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </AppText>
        </Card>

        <GithubOfflineBanner lastSyncAt={repo.syncedAt} />

        <CommitsSection commits={commits} />
        <ReleasesSection releases={releases} />
      </View>
    </Screen>
  );
}

function CommitsSection({ commits }: { commits: GitHubCommit[] }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.section}>
      <SectionHeader title="Commits" subtitle={commits.length === 0 ? 'No cached commits.' : `${commits.length} recent`} icon="git-commit-outline" />
      {commits.length === 0 ? (
        <Card>
          <AppText variant="bodySmall" muted>
            No commits synced for this repository yet.
          </AppText>
        </Card>
      ) : (
        <Card>
          <View style={styles.list}>
            {commits.map((c) => (
              <GithubUpdateRow
                key={c.id}
                kind="commit"
                title={c.message.split('\n')[0]}
                subtitle={c.sha.slice(0, 7)}
                meta={formatCommitMeta(c.authorDate, c.authorName)}
              />
            ))}
          </View>
        </Card>
      )}
    </View>
  );
}

function ReleasesSection({ releases }: { releases: GitHubRelease[] }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.section}>
      <SectionHeader title="Releases" subtitle={releases.length === 0 ? 'No cached releases.' : `${releases.length} recent`} icon="pricetag-outline" />
      {releases.length === 0 ? (
        <Card>
          <AppText variant="bodySmall" muted>
            No releases synced for this repository yet.
          </AppText>
        </Card>
      ) : (
        <Card>
          <View style={styles.list}>
            {releases.map((r) => (
              <GithubUpdateRow
                key={r.id}
                kind="release"
                title={r.tagName}
                subtitle={r.name ? `${r.name}` : undefined}
                meta={relative(r.publishedAt)}
                body={r.body}
              />
            ))}
          </View>
        </Card>
      )}
    </View>
  );
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

function formatCommitMeta(authorDate: string | null, authorName: string | null): string {
  const parts: string[] = [];
  const when = relative(authorDate);
  if (when) parts.push(when);
  if (authorName) parts.push(authorName);
  return parts.join(' · ');
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    section: {
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    repoMeta: {
      marginTop: spacing.sm,
    },
    list: {
      gap: spacing.md,
    },
  });
