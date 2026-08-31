// ---------------------------------------------------------------------------
// CoachMessageBubble — distinct-but-subtle message styling (Phase 7 Step 6 §4).
//
// User messages: compact, right-aligned, on the accent surface with inverse
// text — easy to scan and clearly the learner's own words.
// Coach messages: left-aligned, slightly more spacious, on a neutral surface,
// with the light CoachMarkdown renderer for readable explanations.
//
// Both use the app theme tokens (§18) and avoid heavy shadows/borders.
// ---------------------------------------------------------------------------

import { StyleSheet, Text, View } from 'react-native';

import {
  radius,
  spacing,
  typography,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';
import { CoachMarkdown } from './CoachMarkdown';

type CoachMessageBubbleProps = {
  role: 'user' | 'assistant' | 'system';
  text: string;
  /** ISO timestamp, shown only when useful (e.g. first of a run). */
  showTimestamp?: boolean;
  timestamp?: string;
};

export function CoachMessageBubble({
  role,
  text,
  showTimestamp = false,
  timestamp,
}: CoachMessageBubbleProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (role === 'system') {
    return (
      <View style={styles.systemWrap}>
        <View style={styles.system}>
          <Text style={[styles.systemText, { color: colors.text.muted }]}>
            {text}
          </Text>
        </View>
      </View>
    );
  }

  if (role === 'user') {
    return (
      <View style={[styles.row, styles.rowUser]}>
        <View style={[styles.user, { backgroundColor: colors.accent.primary }]}>
          <Text style={[styles.userText, { color: colors.text.inverse }]}>
            {text}
          </Text>
        </View>
        {showTimestamp && timestamp ? (
          <Text style={[styles.meta, { color: colors.text.muted }]}>
            {formatTime(timestamp)}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.rowCoach]}>
      <View style={[styles.coach, { backgroundColor: colors.surface.secondary }]}>
        <CoachMarkdown
          content={text}
          color={colors.text.primary}
          codeColor={colors.accent.secondary}
        />
      </View>
      {showTimestamp && timestamp ? (
        <Text style={[styles.meta, { color: colors.text.muted }]}>
          {formatTime(timestamp)}
        </Text>
      ) : null}
    </View>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      maxWidth: '100%',
      gap: spacing.xs,
    },
    rowUser: {
      alignSelf: 'flex-end',
      alignItems: 'flex-end',
    },
    rowCoach: {
      alignSelf: 'flex-start',
      alignItems: 'flex-start',
    },

    user: {
      maxWidth: '84%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.lg,
      borderBottomRightRadius: radius.sm,
    },
    userText: {
      ...typography.body,
    },

    coach: {
      maxWidth: '92%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.lg,
      borderBottomLeftRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    systemWrap: {
      alignSelf: 'center',
      maxWidth: '90%',
    },
    system: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: colors.surface.secondary,
    },
    systemText: {
      ...typography.caption,
      textAlign: 'center',
    },

    meta: {
      ...typography.caption,
      paddingHorizontal: spacing.xs,
    },
  });
