// ---------------------------------------------------------------------------
// GitHub device-flow card (connecting state).
//
// Shows the one-time user code and verification URL the learner must visit to
// authorize, and the live polling status. Tapping the URL opens the device
// verification page in the OS browser.
// ---------------------------------------------------------------------------

import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import {
  radius,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';
import type { DeviceCode } from '@/github/githubService';
import type { DeviceFlowView } from '../useGitHubHub';

export function GithubDeviceFlowCard({
  flow,
  onCancel,
}: {
  flow: DeviceFlowView;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { device } = flow;

  const openVerification = () => {
    Linking.openURL(device.verificationUriComplete || device.verificationUri).catch(
      () => undefined
    );
  };

  return (
    <Card>
      <View style={styles.titleRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accent.soft }]}>
          <Ionicons name="logo-github" size={28} color={colors.accent.primary} />
        </View>
        <AppText variant="h3" style={styles.flex}>
          Authorize on GitHub
        </AppText>
      </View>

      <AppText variant="bodySmall" muted style={styles.step}>
        On another device or browser, open GitHub and enter this code:
      </AppText>

      <View style={[styles.codeBox, { borderColor: colors.border.strong }]}>
        <AppText variant="h2" style={{ letterSpacing: 4 }}>
          {device.userCode}
        </AppText>
      </View>

      <Pressable
        onPress={openVerification}
        accessibilityRole="link"
        style={styles.uriRow}
      >
        <AppText variant="bodySmall" style={{ color: colors.accent.primary, fontWeight: '600' }}>
          Open verification page
        </AppText>
        <Ionicons name="open-outline" size={16} color={colors.accent.primary} />
      </Pressable>

      <View style={styles.statusRow}>
        {flow.polling ? (
          <ActivityIndicator size="small" color={colors.accent.primary} />
        ) : (
          <Ionicons name="time-outline" size={16} color={colors.text.muted} />
        )}
        <AppText variant="caption" muted style={styles.flex}>
          {flow.pollMessage}
        </AppText>
      </View>

      <Button title="Cancel" variant="secondary" onPress={onCancel} />
    </Card>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    step: {
      marginBottom: spacing.sm,
    },
    codeBox: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    uriRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
  });
