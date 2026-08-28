import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  Badge,
  Button,
  Card,
  FadeInView,
  IconButton,
  Screen,
} from '@/components/ui';
import { useToast } from '@/components/toast';

import { getChallengeById } from '@/repositories/challengeRepository';
import { recordChallengeAttempt } from '@/repositories/progressRepository';
import type { CodeChallenge } from '@/code/challengeTypes';
import type {
  CodeChallengeResult,
  CodeTestResult,
} from '@/code/types';
import type { Challenge } from '@/types/learning';
import { executeChallenge } from '@/code/execution/executeChallenge';
import { getJavaScriptEngine } from '@/code/engine';
import { CodeEditor } from '@/components/code/CodeEditor';

import {
  radius,
  spacing,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

export default function ChallengeScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [challenge, setChallenge] = useState<CodeChallenge | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [engineStatus, setEngineStatus] = useState<
    'available' | 'unavailable' | 'initializing' | 'error'
  >('unavailable');

  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CodeChallengeResult | null>(null);

  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  useEffect(() => {
    if (!id) return;

    const refreshEngineStatus = () =>
      setEngineStatus(getJavaScriptEngine().getStatus());

    refreshEngineStatus();
    const interval = setInterval(refreshEngineStatus, 750);

    getChallengeById(id)
      .then((c) => {
        if (!c) {
          setLoadError(true);
          return;
        }
        applyChallenge(toCodeChallenge(c));
      })
      .catch(() => setLoadError(true))
      .finally(() => clearInterval(interval));

    return () => clearInterval(interval);
  }, [id]);

  function applyChallenge(next: CodeChallenge) {
    setChallenge(next);
    setResult(null);
    if (next.starterCode) {
      setCode(next.starterCode);
    }
  }

  function toCodeChallenge(c: Challenge): CodeChallenge {
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      language: 'javascript',
      starterCode: c.starterCode,
      functionName: c.functionName,
      tests: c.testCases.map((tc) => ({
        id: tc.id,
        args: tc.args,
        expected: tc.expected,
      })),
      hints: c.hints.map((hint) => hint.content),
      explanation: c.explanation,
    };
  }

  async function runCode() {
    if (!challenge) return;

    setRunning(true);
    setResult(null);

    const challengeResult = await executeChallenge(
      code,
      challenge.functionName,
      challenge.tests
    );

    setResult(challengeResult);
    setRunning(false);

    if (challengeResult.passed) {
      showToast(
        `All tests passed (${challengeResult.testsPassed}/${challengeResult.testsTotal})!`,
        'success'
      );

      recordChallengeAttempt({
        challengeId: challenge.id,
        testsPassed: challengeResult.testsPassed,
        testsTotal: challengeResult.testsTotal,
        passed: challengeResult.passed,
      }).catch(() => {
        // Non-blocking: progress recording failure should not block the result.
      });
    } else {
      showToast(
        `${challengeResult.testsPassed}/${challengeResult.testsTotal} tests passed`,
        'error'
      );
    }
  }

  if (loadError) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={40}
            color={colors.text.muted}
          />
          <AppText style={styles.centerText}>
            Couldn't load this challenge
          </AppText>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (!challenge) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <AppText muted>Loading challenge...</AppText>
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xs }]}>
        <IconButton name="arrow-back" onPress={() => router.back()} />
        <View style={styles.headerBadges}>
          <Badge label="Easy" variant="warning" />
          <EngineBadge status={engineStatus} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
          <AppText variant="h1">{challenge.title}</AppText>

          <AppText muted style={styles.desc}>
            {challenge.description}
          </AppText>

          <Card>
            <AppText variant="h3">Problem</AppText>
            <AppText style={styles.problemText}>
              {challenge.description}
            </AppText>
          </Card>
        </FadeInView>

        <FadeInView>
          <View style={styles.editorContainer}>
            <View style={styles.editorHeader}>
              <AppText variant="caption" style={styles.editorLang}>
                JavaScript
              </AppText>
            </View>

            <CodeEditor
              value={code}
              onChangeText={setCode}
              placeholder="Write your function here..."
            />
          </View>
        </FadeInView>

        <FadeInView>
          <Button
            title={running ? 'Running...' : 'Run Code'}
            loading={running}
            disabled={running}
            onPress={runCode}
          />
        </FadeInView>

        <FadeInView>
          <Card>
            <AppText variant="h3">Test Cases</AppText>
            <View style={styles.tests}>
              {challenge.tests.map((test, index) => {
                const testResult = result?.tests.find(
                  (t) => t.testCaseId === test.id
                );

                return (
                  <TestCase
                    key={test.id}
                    index={index}
                    args={test.args}
                    expected={test.expected}
                    result={testResult}
                  />
                );
              })}
            </View>
          </Card>
        </FadeInView>

        {result && (
          <FadeInView>
            <ResultsPanel result={result} onContinue={() => router.back()} />
          </FadeInView>
        )}
      </ScrollView>
    </View>
  );
}

function EngineBadge({
  status,
}: {
  status: 'available' | 'unavailable' | 'initializing' | 'error';
}) {
  if (status === 'available') {
    return <Badge label="Engine: On" variant="success" />;
  }
  if (status === 'error') {
    return <Badge label="Engine: Error" variant="error" />;
  }
  if (status === 'initializing') {
    return <Badge label="Engine: Starting" variant="warning" />;
  }
  return <Badge label="Engine: Offline" variant="warning" />;
}

function TestCase({
  index,
  args,
  expected,
  result,
}: {
  index: number;
  args: unknown[];
  expected: unknown;
  result?: CodeTestResult;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const evaluated = Boolean(result);

  let icon: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
  let color: string = colors.text.muted;

  if (evaluated) {
    icon = result!.passed ? 'checkmark-circle' : 'close-circle';
    color = result!.passed ? colors.status.success : colors.status.error;
  }

  return (
    <View style={styles.test}>
      <View style={styles.testHeader}>
        <Ionicons name={icon} size={18} color={color} />
        <AppText
          variant="bodySmall"
          style={{ color, fontWeight: '600' }}
        >
          Test {index + 1}
        </AppText>
        {result && (
          <AppText variant="caption" muted>
            {result.executionTimeMs} ms
          </AppText>
        )}
      </View>

      <AppText variant="caption" muted>
        Input: {JSON.stringify(args)}
      </AppText>
      <AppText variant="caption" muted>
        Expected: {JSON.stringify(expected)}
      </AppText>

      {evaluated && result!.actualValue !== undefined && (
        <AppText
          variant="caption"
          style={{
            color: result!.passed
              ? colors.status.success
              : colors.text.secondary,
          }}
        >
          Actual: {JSON.stringify(result!.actualValue)}
        </AppText>
      )}

      {result?.error && (
        <AppText variant="caption" style={styles.testError}>
          {result.error}
        </AppText>
      )}
    </View>
  );
}

function ResultsPanel({
  result,
  onContinue,
}: {
  result: CodeChallengeResult;
  onContinue: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  if (result.passed) {
    return (
      <View style={styles.resultsSuccess}>
        <View style={styles.resultsHeader}>
          <Ionicons
            name="trophy"
            size={26}
            color={colors.status.success}
          />
          <AppText variant="h2" style={styles.resultsTitle}>
            All tests passed!
          </AppText>
        </View>
        <AppText variant="bodySmall" muted>
          You passed {result.testsPassed} of {result.testsTotal} tests.
        </AppText>
        <Button title="Continue" onPress={onContinue} />
      </View>
    );
  }

  return (
    <View style={styles.resultsFail}>
      <View style={styles.resultsHeader}>
        <Ionicons
          name="alert-circle"
          size={26}
          color={colors.status.error}
        />
        <AppText variant="h2" style={styles.resultsTitle}>
          Not quite yet
        </AppText>
      </View>
      <AppText variant="bodySmall" muted>
        {result.testsPassed} of {result.testsTotal} tests passed. Check the
        failing test outputs above and try again.
      </AppText>
      <AppText variant="caption" muted>
        Tip: make sure your function is named correctly and returns the
        expected value.
      </AppText>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background.primary,
    },

    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      padding: spacing.lg,
    },

    centerText: {
      color: colors.text.secondary,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
      backgroundColor: colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
    },

    headerBadges: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    scroll: {
      flex: 1,
    },

    container: {
      padding: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },

    desc: {
      marginTop: spacing.xs,
    },

    problemText: {
      marginTop: spacing.md,
      color: colors.text.secondary,
      lineHeight: 22,
    },

    editorContainer: {
      borderRadius: radius.lg,
      overflow: 'hidden',
    },

    editorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
      backgroundColor: colors.background.tertiary,
    },

    editorLang: {
      color: colors.accent.secondary,
      fontWeight: '600',
    },

    tests: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },

    test: {
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surface.secondary,
      gap: 4,
    },

    testHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },

    testError: {
      color: colors.status.error,
      marginTop: 4,
    },

    resultsSuccess: {
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.status.success + '99',
      backgroundColor: colors.status.success + '14',
      gap: spacing.sm,
    },

    resultsFail: {
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.status.error + '99',
      backgroundColor: colors.status.error + '14',
      gap: spacing.sm,
    },

    resultsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    resultsTitle: {
      color: colors.text.primary,
    },
  });
