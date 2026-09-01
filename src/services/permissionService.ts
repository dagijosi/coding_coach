import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const PERMISSION_PREFS_KEY = 'coding_coach_permission_preferences';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export type NotificationPreferences = {
  notificationsEnabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderHour: number; // 0-23 (default: 19 = 7 PM)
  dailyReminderMinute: number; // 0-59 (default: 0)
  streakAlertsEnabled: boolean;
  updateAlertsEnabled: boolean;
  lastPromptedAt: number | null;
  permissionPromptCount: number;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  notificationsEnabled: false,
  dailyReminderEnabled: true,
  dailyReminderHour: 19,
  dailyReminderMinute: 0,
  streakAlertsEnabled: true,
  updateAlertsEnabled: true,
  lastPromptedAt: null,
  permissionPromptCount: 0,
};

/**
 * Checks the current system notification permission state.
 */
export async function getSystemNotificationPermissionStatus(): Promise<PermissionStatus> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
      return 'granted';
    }
    if (settings.canAskAgain) {
      return 'undetermined';
    }
    return 'denied';
  } catch (error) {
    console.warn('[permissionService] Failed to check permissions:', error);
    return 'undetermined';
  }
}

/**
 * Requests system notification permission from the OS and records the response.
 */
export async function requestSystemNotificationPermission(): Promise<{
  granted: boolean;
  status: PermissionStatus;
}> {
  try {
    const current = await Notifications.getPermissionsAsync();
    let status = current;

    if (!current.granted && current.canAskAgain) {
      status = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
    }

    const isGranted = Boolean(
      status.granted ||
      status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );

    const resultStatus: PermissionStatus = isGranted
      ? 'granted'
      : status.canAskAgain
      ? 'undetermined'
      : 'denied';

    // Update and persist preferences
    const currentPrefs = await getNotificationPreferences();
    await saveNotificationPreferences({
      ...currentPrefs,
      notificationsEnabled: isGranted,
      lastPromptedAt: Date.now(),
      permissionPromptCount: currentPrefs.permissionPromptCount + 1,
    });

    return {
      granted: isGranted,
      status: resultStatus,
    };
  } catch (error) {
    console.error('[permissionService] Failed to request permissions:', error);
    return {
      granted: false,
      status: 'denied',
    };
  }
}

/**
 * Retrieves saved notification & permission preferences.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PERMISSION_PREFS_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (error) {
    console.warn('[permissionService] Error reading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Persists updated notification & permission preferences.
 */
export async function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  try {
    const current = await getNotificationPreferences();
    const updated = { ...current, ...prefs };
    await AsyncStorage.setItem(PERMISSION_PREFS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('[permissionService] Error saving preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}
