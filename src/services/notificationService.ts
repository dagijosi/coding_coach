import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  getNotificationPreferences,
  getSystemNotificationPermissionStatus,
  requestSystemNotificationPermission,
} from './permissionService';

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STUDY_REMINDER_IDENTIFIER = 'daily_study_reminder';
const STREAK_SAVER_IDENTIFIER = 'streak_saver_reminder';

/**
 * Initializes notification channels on Android and sets up notification listeners.
 */
export async function initializeNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#38BDF8',
    });

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily Study Reminders',
      description: 'Daily practice reminders and streak protection alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#38BDF8',
    });
  }
}

/**
 * Schedules the recurring daily study reminder based on saved preferences.
 */
export async function scheduleDailyStudyReminder(): Promise<boolean> {
  try {
    const status = await getSystemNotificationPermissionStatus();
    if (status !== 'granted') {
      return false;
    }

    const prefs = await getNotificationPreferences();
    if (!prefs.dailyReminderEnabled) {
      await cancelDailyStudyReminder();
      return false;
    }

    // Cancel previous reminder before scheduling a new one
    await cancelDailyStudyReminder();

    await Notifications.scheduleNotificationAsync({
      identifier: STUDY_REMINDER_IDENTIFIER,
      content: {
        title: '⚡ Time for Daily Code Practice!',
        body: 'Keep your streak alive. Complete 1 quick lesson or practice problem today.',
        sound: true,
        data: { screen: 'learn' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: prefs.dailyReminderHour,
        minute: prefs.dailyReminderMinute,
        channelId: 'reminders',
      },
    });

    return true;
  } catch (error) {
    console.warn('[notificationService] Failed to schedule daily reminder:', error);
    return false;
  }
}

/**
 * Cancels scheduled daily study reminders.
 */
export async function cancelDailyStudyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(STUDY_REMINDER_IDENTIFIER);
  } catch (error) {
    console.warn('[notificationService] Failed to cancel daily reminder:', error);
  }
}

const WEEKLY_REPORT_IDENTIFIER = 'weekly_progress_report';

/**
 * Schedules the recurring Sunday weekly progress summary report.
 */
export async function scheduleWeeklyReport(): Promise<boolean> {
  try {
    const status = await getSystemNotificationPermissionStatus();
    if (status !== 'granted') return false;

    await cancelWeeklyReport();

    await Notifications.scheduleNotificationAsync({
      identifier: WEEKLY_REPORT_IDENTIFIER,
      content: {
        title: '📊 Your Weekly Coding Summary',
        body: 'Check out your XP gains, lesson mastery, and streak milestones this week!',
        sound: true,
        data: { screen: 'profile' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 10,
        minute: 0,
        channelId: 'reminders',
      },
    });

    return true;
  } catch (error) {
    console.warn('[notificationService] Failed to schedule weekly report:', error);
    return false;
  }
}

export async function cancelWeeklyReport(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_REPORT_IDENTIFIER);
  } catch (error) {
    console.warn('[notificationService] Failed to cancel weekly report:', error);
  }
}

/**
 * Sends an immediate local test notification to verify system notification permissions and channel setup.
 */
export async function sendTestNotification(): Promise<{ success: boolean; message: string }> {
  try {
    let status = await getSystemNotificationPermissionStatus();
    if (status !== 'granted') {
      const req = await requestSystemNotificationPermission();
      if (!req.granted) {
        return {
          success: false,
          message: 'Notification permission was not granted by the OS.',
        };
      }
    }

    await initializeNotificationChannels();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Notifications are Active!',
        body: 'Coding Coach is ready to send you daily study reminders and streak protection alerts.',
        sound: true,
        data: { test: true },
      },
      trigger: null, // trigger immediately
    });

    return {
      success: true,
      message: 'Test notification sent successfully!',
    };
  } catch (error) {
    console.error('[notificationService] Test notification failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unable to send notification.',
    };
  }
}
