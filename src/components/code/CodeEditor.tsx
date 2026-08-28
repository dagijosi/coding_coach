import { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import {
  highlightJavaScript,
  type CodeSegment,
} from './javascriptHighlighter';

const EDITOR_COLORS = {
  keyword: '#C586C0',
  literal: '#569CD6',
  string: '#CE9178',
  number: '#B5CEA8',
  comment: '#6A9955',
  default: colors.text.primary,
};

const EDITOR_STYLE = {
  fontFamily: typography.code.fontFamily,
  fontSize: typography.code.fontSize,
  lineHeight: typography.code.lineHeight,
};

type CodeEditorProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  minHeight?: number;
  editable?: boolean;
};

export function CodeEditor({
  value,
  onChangeText,
  placeholder,
  minHeight = 260,
  editable = true,
}: CodeEditorProps) {
  const [focused, setFocused] = useState(false);

  const segments = useMemo<CodeSegment[]>(
    () => highlightJavaScript(value, EDITOR_COLORS),
    [value]
  );

  return (
    <View
      style={[
        styles.container,
        { minHeight },
        focused && styles.containerFocused,
      ]}
    >
      <TextInput
        style={[styles.input, { minHeight }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        multiline
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={colors.accent.secondary}
        cursorColor={colors.accent.secondary}
      />

      <Text
        selectable={false}
        pointerEvents="none"
        style={[styles.highlight, { minHeight }]}
      >
        {segments.map((segment, index) => (
          <Text
            key={index}
            style={{ color: segment.color }}
          >
            {segment.text}
          </Text>
        ))}
        {'\u200B'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    minHeight: 260,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.secondary,
    overflow: 'hidden',
  },

  containerFocused: {
    borderColor: colors.accent.secondary,
  },

  input: {
    ...EDITOR_STYLE,
    minHeight: 260,
    padding: spacing.md,
    color: 'transparent',
    includeFontPadding: false,
    textAlignVertical: 'top',
  },

  highlight: {
    ...EDITOR_STYLE,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    color: colors.text.primary,
    includeFontPadding: false,
  },
});
