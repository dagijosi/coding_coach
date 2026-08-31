// ---------------------------------------------------------------------------
// CoachMarkdown — minimal, dependency-free renderer for coach message text.
//
// The CoachResponseEngine emits plain deterministic text: paragraphs separated
// by blank lines, single-newline line breaks inside a paragraph (e.g. a code
// prompt), and `- ` prefixed list items. Occasionally text may contain
// `` `inline code` `` spans. We render exactly those constructs with the app's
// theme tokens. No heavy markdown dependency was added (§5, §18).
// ---------------------------------------------------------------------------

import { StyleSheet, Text, View } from 'react-native';

import {
  spacing,
  typography,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type CoachMarkdownProps = {
  content: string;
  /** Base text color (usually the bubble's foreground). */
  color: string;
  /** Optional inline-code foreground override. */
  codeColor?: string;
};

/**
 * Renders inline code spans (delimited by single backticks) in a monospace
 * face at the given color, keeping surrounding text in the base color.
 */
function renderInline(text: string, color: string, codeColor: string) {
  const parts = text.split('`');
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <Text
        key={index}
        style={{ color: codeColor, fontFamily: 'monospace' }}
      >
        {part}
      </Text>
    ) : (
      <Text key={index} style={{ color }}>
        {part}
      </Text>
    )
  );
}

export function CoachMarkdown({ content, color, codeColor }: CoachMarkdownProps) {
  const styles = useThemedStyles(makeStyles);
  const code = codeColor ?? color;
  const trimmed = content.trim();
  if (!trimmed) {
    return <View style={styles.empty} />;
  }

  // Split into paragraphs on blank lines; single newlines are preserved by the
  // Text component, so embedded prompts/line breaks survive.
  const blocks = trimmed.split(/\n{2,}/);

  return (
    <View style={styles.container}>
      {blocks.map((block, blockIndex) => {
        const isList =
          block.split('\n').length > 0 &&
          block
            .split('\n')
            .every((line) => line.trim().startsWith('- '));

        if (isList) {
          return (
            <View key={blockIndex} style={styles.list}>
              {block.split('\n').map((line, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={[styles.text, { color }]}>
                    {'\u2022\u2002'}
                    {renderInline(line.replace(/^-\s+/, ''), color, code)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        return (
          <Text key={blockIndex} style={[styles.text, { color }]}>
            {renderInline(block, color, code)}
          </Text>
        );
      })}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      gap: spacing.xs,
    },
    empty: {
      height: 1,
    },
    list: {
      gap: spacing.xxs,
    },
    listItem: {
      marginLeft: spacing.sm,
    },
    text: {
      ...typography.body,
    },
  });
