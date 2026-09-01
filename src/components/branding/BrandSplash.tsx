import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons } from '@expo/vector-icons';

import { AppText } from '@/components/ui/AppText';
import { radius, shadows, spacing, useTheme } from '@/theme';
import appIcon from '../../../assets/icon.png';

const LOADING_STAGES = [
  { at: 0.2, text: 'Initializing local offline database...' },
  { at: 0.5, text: 'Loading interactive curriculum & problems...' },
  { at: 0.8, text: 'Preparing offline JavaScript engine...' },
  { at: 0.95, text: 'Starting your AI Coach...' },
  { at: 1.0, text: 'Ready! Launching...' },
];

export type BrandSplashProps = {
  onFinish?: () => void;
};

/**
 * Modern animated splash screen written in pure TSX with real-time loading progress bar,
 * app icon, branding typography, and smooth stage transitions.
 */
export function BrandSplash({ onFinish }: BrandSplashProps) {
  const { colors, resolvedMode } = useTheme();
  const released = useRef(false);

  const [progressVal, setProgressVal] = useState(0);
  const [statusText, setStatusText] = useState('Starting Coding Coach...');

  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Release the native OS splash immediately so our custom TSX screen displays seamlessly
  useEffect(() => {
    if (!released.current) {
      released.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, []);

  // Animate the logo entrance
  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoScale, logoOpacity]);

  // Smooth realistic progress animation
  useEffect(() => {
    const durationMs = 1800;
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const fraction = Math.min(1, elapsed / durationMs);

      // Eased progress curve
      const eased = Math.min(1, Math.pow(fraction, 0.85));
      setProgressVal(eased);

      // Find current stage text
      const stage =
        LOADING_STAGES.find((s) => eased <= s.at) ||
        LOADING_STAGES[LOADING_STAGES.length - 1];
      setStatusText(stage.text);

      if (fraction >= 1) {
        clearInterval(interval);
        if (onFinish) {
          setTimeout(onFinish, 250);
        }
      }
    }, 35);

    return () => clearInterval(interval);
  }, [onFinish]);

  const isDark = resolvedMode !== 'light';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#050C27' : '#FDFDFD' },
      ]}
    >
      {/* Decorative ambient background glow */}
      <View
        style={[
          styles.glowCircle,
          {
            backgroundColor: isDark
              ? 'rgba(56, 189, 248, 0.08)'
              : 'rgba(56, 189, 248, 0.12)',
            top: '20%',
          },
        ]}
      />

      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* App Icon Box */}
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: isDark ? '#0A1538' : '#FFFFFF',
              borderColor: isDark
                ? 'rgba(56, 189, 248, 0.25)'
                : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <Image
            source={appIcon}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Title & Brand */}
        <View style={styles.brandTextGroup}>
          <View style={styles.badgeRow}>
            <Ionicons name="flash" size={12} color={colors.status.warning} />
            <AppText variant="caption" style={styles.badgeText}>
              OFFLINE AI COACH
            </AppText>
          </View>
          <AppText variant="h1" style={styles.appTitle}>
            Coding Coach
          </AppText>
          <AppText variant="bodySmall" muted style={styles.appSubtitle}>
            Your Personal Code Mentor &amp; Interactive Learning Path
          </AppText>
        </View>
      </Animated.View>

      {/* Bottom Loading Progress Bar */}
      <View style={styles.bottomSection}>
        <View style={styles.progressRow}>
          <AppText variant="caption" muted style={styles.statusLabel}>
            {statusText}
          </AppText>
          <AppText
            variant="caption"
            style={[styles.percentText, { color: colors.accent.primary }]}
          >
            {Math.round(progressVal * 100)}%
          </AppText>
        </View>

        {/* Progress Track */}
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progressVal * 100)}%`,
                backgroundColor: colors.accent.primary,
              },
            ]}
          />
        </View>

        <AppText variant="caption" muted style={styles.footerNote}>
          100% Offline · No Internet Required
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },

  glowCircle: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    width: '100%',
  },

  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: radius.xxl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    ...shadows.medium,
  },

  logoImage: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
  },

  brandTextGroup: {
    alignItems: 'center',
    gap: spacing.xs,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    marginBottom: 4,
  },

  badgeText: {
    color: '#F59E0B',
    fontWeight: '700',
    letterSpacing: 0.8,
    fontSize: 10,
  },

  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  appSubtitle: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },

  bottomSection: {
    width: '100%',
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  statusLabel: {
    flex: 1,
    marginRight: spacing.sm,
  },

  percentText: {
    fontWeight: '700',
  },

  progressTrack: {
    width: '100%',
    height: 7,
    borderRadius: radius.full,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },

  footerNote: {
    textAlign: 'center',
    marginTop: spacing.xs,
    fontSize: 11,
  },
});