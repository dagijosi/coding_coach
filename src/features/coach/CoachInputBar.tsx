// ---------------------------------------------------------------------------
// CoachInputBar — multiline composer + send (Phase 7 Step 6 §13).
//
// Keyboard-safe (composes inside the app's flex root; the screen owns the
// keyboard inset/offset), whitespace guarded, clears after send, and the send
// action is disabled while the engine is processing (§10) or the input is empty.
// ---------------------------------------------------------------------------

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useImperativeHandle, useRef } from 'react';

import {
  radius,
  spacing,
  typography,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type CoachInputBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (text: string) => void;
  sending?: boolean;
  placeholder?: string;
};

export const CoachInputBar = forwardRef<TextInput, CoachInputBarProps>(
  function CoachInputBar(
    { value, onChangeText, onSend, sending = false, placeholder },
    ref
  ) {
    const { colors } = useTheme();
    const styles = useThemedStyles(makeStyles);
    const innerRef = useRef<TextInput>(null);
    useImperativeHandle(ref, () => innerRef.current as TextInput);

    const trimmed = value.trim();
    const canSend = trimmed.length > 0 && !sending;

    const handleSend = () => {
      if (!canSend) return;
      onSend(value);
      // Cleared by the screen after a successful send; also clear locally if it
      // wasn't (best-effort) so the field feels responsive.
      onChangeText('');
      innerRef.current?.blur();
    };

    return (
      <View style={styles.bar}>
        <TextInput
          ref={innerRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? 'Ask your coach...'}
          placeholderTextColor={colors.text.muted}
          style={styles.input}
          multiline
          maxLength={2000}
          returnKeyType="default"
          accessibilityLabel="Message your coach"
          selectionColor={colors.accent.primary}
        />
        <SendButton
          enabled={canSend}
          sending={sending}
          onPress={handleSend}
        />
      </View>
    );
  }
);

function SendButton({
  enabled,
  sending,
  onPress,
}: {
  enabled: boolean;
  sending: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={sending ? 'Coach is responding' : 'Send message'}
      accessibilityState={{ disabled: !enabled }}
      hitSlop={4}
      style={[
        styles.send,
        enabled
          ? { backgroundColor: colors.accent.primary }
          : { backgroundColor: colors.surface.secondary },
        !enabled && styles.sendDisabled,
      ]}
    >
      {sending ? (
        <ActivityIndicator size="small" color={colors.text.inverse} />
      ) : (
        <Ionicons
          name="arrow-up"
          size={20}
          color={enabled ? colors.text.inverse : colors.text.muted}
        />
      )}
    </Pressable>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      backgroundColor: colors.surface.primary,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
      borderColor: colors.border.default,
      ...typography.body,
      color: colors.text.primary,
      textAlignVertical: 'top',
    },
    send: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendDisabled: {
      opacity: 0.6,
    },
  });
