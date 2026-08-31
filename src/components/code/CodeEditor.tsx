import { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  radius,
  spacing,
  typography,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';
import {
  highlightJavaScript,
  type CodeSegment,
} from './javascriptHighlighter';

const DARK_EDITOR_COLORS = {
  keyword: '#C586C0',
  literal: '#569CD6',
  string: '#CE9178',
  number: '#B5CEA8',
  comment: '#6A9955',
};

const LIGHT_EDITOR_COLORS = {
  keyword: '#892A84',
  literal: '#004F9E',
  string: '#9E3C1B',
  number: '#1B6E41',
  comment: '#5D6962',
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
  const { colors, resolvedMode } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [focused, setFocused] = useState(false);

  const editorColors = useMemo(() => {
    const base = resolvedMode === 'light' ? LIGHT_EDITOR_COLORS : DARK_EDITOR_COLORS;
    return {
      ...base,
      default: colors.text.primary,
    };
  }, [resolvedMode, colors.text.primary]);

  const segments = useMemo<CodeSegment[]>(
    () => highlightJavaScript(value, editorColors),
    [value, editorColors]
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

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
