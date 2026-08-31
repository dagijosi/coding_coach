// ---------------------------------------------------------------------------
// useGitHubHub — controller for the GitHub screens (Phase 8).
//
// Owns the connection + sync state machine so the screens stay presentational.
// Every operation delegates to the GitHub application service; the UI never
// touches the GitHub API or SQLite directly.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  beginDeviceFlow,
  completeDeviceFlow,
  disconnectGitHub,
  getGitHubAccount,
  getGitHubUpdates,
  getSyncAvailability,
  setRepositorySelected,
  syncGitHub,
  refreshRepositoryList,
} from '@/github/githubService';
import type {
  DeviceCode,
  GitHubAccount,
  GitHubErrorInfo,
  GitHubSyncState,
  GitHubUpdates,
  SyncResult,
} from '@/github/githubService';

export type ConnectionState =
  | 'loading'
  | 'disconnected'
  | 'connecting'
  | 'error'
  | 'connected';

export type DeviceFlowView = {
  device: DeviceCode;
  polling: boolean;
  pollMessage: string;
};

export function useGitHubHub() {
  const [connection, setConnection] = useState<ConnectionState>('loading');
  const [account, setAccount] = useState<GitHubAccount | null>(null);
  const [updates, setUpdates] = useState<GitHubUpdates | null>(null);
  const [syncState, setSyncState] = useState<GitHubSyncState | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [deviceFlow, setDeviceFlow] = useState<DeviceFlowView | null>(null);
  const [connectError, setConnectError] = useState<GitHubErrorInfo | null>(null);
  const [banner, setBanner] = useState<GitHubErrorInfo | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const [acc, ups, availability] = await Promise.all([
      getGitHubAccount(),
      getGitHubUpdates(),
      getSyncAvailability(),
    ]);
    setAccount(acc);
    setUpdates(ups);
    setSyncState(ups.syncState);
    setSyncing(availability.syncing);
    setRateLimited(availability.rateLimited);
    setConnection(acc ? 'connected' : 'disconnected');
  }, []);

  useEffect(() => {
    load().catch(() => setConnection('disconnected'));
    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [load]);

  const pollDevice = useCallback(
    async (deviceCode: string, intervalSeconds: number) => {
      const attempt = async () => {
        setDeviceFlow((prev) =>
          prev ? { ...prev, polling: true, pollMessage: 'Checking for authorization…' } : prev
        );
        const result = await completeDeviceFlow(deviceCode);
        if (result.ok) {
          setDeviceFlow(null);
          setAccount(result.account);
          setConnectError(null);
          setConnection('connected');
          await load();
          return;
        }
        if (result.error.retryable) {
          setDeviceFlow((prev) =>
            prev ? { ...prev, polling: false, pollMessage: result.error.message } : prev
          );
          const delay = Math.max(2000, Math.min(intervalSeconds * 1000, 10000));
          pollTimerRef.current = setTimeout(attempt, delay);
        } else {
          setConnectError(result.error);
          setDeviceFlow(null);
          setConnection('error');
        }
      };
      await attempt();
    },
    [load]
  );

  const connect = useCallback(async () => {
    setConnectError(null);
    setConnection('connecting');
    const started = await beginDeviceFlow();
    if (started.status !== 'success') {
      setConnectError(started.error);
      setConnection('error');
      return;
    }
    const { device } = started;
    setDeviceFlow({ device, polling: false, pollMessage: 'Waiting for you to authorize…' });
    await pollDevice(device.deviceCode, device.intervalSeconds);
  }, [pollDevice]);

  const cancelConnect = useCallback(() => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    setDeviceFlow(null);
    setConnectError(null);
    setConnection('disconnected');
  }, []);

  const disconnect = useCallback(async () => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    await disconnectGitHub();
    setDeviceFlow(null);
    setConnectError(null);
    setAccount(null);
    setUpdates(null);
    setSyncState(null);
    setConnection('disconnected');
  }, []);

  const syncNow = useCallback(async () => {
    setSyncing(true);
    setBanner(null);
    try {
      const result: SyncResult = await syncGitHub();
      if (!result.success && result.error) {
        setBanner(result.error);
        if (result.error.kind === 'rate_limited') setRateLimited(true);
      } else if (result.success && result.skippedReason) {
        setBanner({ kind: 'unknown', message: result.skippedReason, retryable: false });
      }
      await load();
    } catch {
      setBanner({
        kind: 'unknown',
        message: 'Syncing GitHub failed. Please try again.',
        retryable: true,
      });
    } finally {
      setSyncing(false);
    }
  }, [load]);

  const toggleRepo = useCallback(
    async (fullName: string, selected: boolean) => {
      await setRepositorySelected(fullName, selected);
      if (updates) {
        const next = updates.repositories.map((r) =>
          r.fullName === fullName ? { ...r, selected } : r
        );
        setUpdates({ ...updates, repositories: next });
      }
    },
    [updates]
  );

  const refreshRepos = useCallback(async () => {
    setBanner(null);
    const result = await refreshRepositoryList();
    if (!result.ok) {
      setBanner(result.error);
    }
    await load();
  }, [load]);

  const clearBanner = useCallback(() => setBanner(null), []);
  const clearConnectError = useCallback(() => setConnectError(null), []);

  return {
    connection,
    account,
    updates,
    syncState,
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
    clearConnectError,
    retryLoad: load,
  };
}
