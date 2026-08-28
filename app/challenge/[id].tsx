import { useEffect, useRef, useState } from 'react';
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

import {
  getChallengeById,
  getChallenges,
} from '@/repositories/challengeRepository';
import {
  getCompletedChallengeIds,
  recordChallengeAttempt,
} from '@/repositories/progressRepository';
import { getLessons } from '@/repositories/lessonRepository';
import { getTopics } from '@/repositories/topicRepository';

import {
  buildPracticeIndex,
  selectNextChallenge,
} from '@/practice/practiceLogic';

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
  const [runError, setRunError] = useState<string | null>(null);
  const [revealedHints, setRevealedHints] = useState(0);
  const [nextId, setNextId] = useState<string | null>(null);

  const practiceIndexRef = useRef<
    ReturnType<typeof buildPracticeIndex> | null
  >(null);
  const completedIdsRef = useRef<ReadonlySet<string>>(new Set());

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

    Promise.all([
      getChallenges(),
      getLessons(),
      getTopics(),
      getCompletedChallengeIds(),
    ])
      .then(([challenges, lessons, topics, completed]) => {
        practiceIndexRef.current = buildPracticeIndex(
          challenges,
          lessons,
          topics
        );
        completedIdsRef.current = new Set(completed);
      })
      .catch(() => {
        // Non-blocking: next-practice selection is best-effort.
      });

    return () => clearInterval(interval);
  }, [id]);

  function applyChallenge(next: CodeChallenge) {
    setChallenge(next);
    setResult(null);
    setRunError(null);
    setRevealedHints(0);
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

    if (getJavaScriptEngine().getStatus() !== 'available') {
      showToast(
        'Code engine is still loading — please try again.',
        'info'
      );
      return;
    }

    setRunning(true);
    setResult(null);
    setRunError(null);

    try {
      const challengeResult = await executeChallenge(
        code,
        challenge.functionName,
        challenge.tests
      );

      setResult(challengeResult);

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

        const index = practiceIndexRef.current;
        if (index) {
          const completed = new Set(completedIdsRef.current);
          completed.add(challenge.id);
          setNextId(selectNextChallenge(index, completed, challenge.id));
        }
      } else {
        showToast(
          `${challengeResult.testsPassed}/${challengeResult.testsTotal} tests passed`,
          'error'
        );
      }
    } catch (error) {
      const timedOut =
        error instanceof Error &&
        (error.name === 'TimeoutError' ||
          /timed out/i.test(error.message));

      setRunError(
        timedOut
          ? 'Your code timed out.'
          : 'Could not run your code.'
      );
      showToast(
        timedOut ? 'Your code timed out.' : 'Could not run your code.',
        'error'
      );
    } finally {
      setRunning(false);
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

        {runError && (
          <FadeInView>
            <View style={styles.errorPanel}>
              <View style={styles.resultsHeader}>
                <Ionicons
                  name="alert-circle"
                  size={22}
                  color={colors.status.error}
                />
                <AppText variant="body" style={styles.errorTitle}>
                  {runError}
                </AppText>
              </View>
              <Button
                title="Retry"
                variant="ghost"
                onPress={runCode}
              />
            </View>
          </FadeInView>
        )}

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

        {revealedHints < challenge.hints.length && (
          <FadeInView>
            <Button
              title={
                revealedHints === 0
                  ? 'Show hint'
                  : `Show next hint (${revealedHints}/${challenge.hints.length})`
              }
              variant="ghost"
              onPress={() => setRevealedHints((v) => v + 1)}
            />
          </FadeInView>
        )}

        {revealedHints > 0 && (
          <FadeInView>
            <View style={styles.hintsPanel}>
              {challenge.hints
                .slice(0, revealedHints)
                .map((hint, idx) => (
                  <View key={idx} style={styles.hintItem}>
                    <View style={styles.hintItemHeader}>
                      <Ionicons
                        name="bulb-outline"
                        size={14}
                        color={colors.status.warning}
                      />
                      <AppText
                        variant="caption"
                        style={styles.hintItemLabel}
                      >
                        Hint {idx + 1}
                      </AppText>
                    </View>
                    <AppText variant="bodySmall">
                      {hint}
                    </AppText>
                  </View>
                ))}
            </View>
          </FadeInView>
        )}

        {result && (
          <FadeInView>
            <ResultsPanel
              result={result}
              onNext={nextId ? () => router.replace(`/challenge/${nextId}`) : undefined}
              onContinue={() => router.back()}
            />
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
  onNext,
  onContinue,
}: {
  result: CodeChallengeResult;
  onNext?: () => void;
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
        {onNext ? (
          <>
            <Button title="Next Practice" onPress={onNext} />
            <Button title="Back to Practice" variant="ghost" onPress={onContinue} />
          </>
        ) : (
          <Button title="Continue" onPress={onContinue} />
        )}
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

    errorPanel: {
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.status.error + '99',
      backgroundColor: colors.status.error + '14',
      gap: spacing.md,
    },

    errorTitle: {
      color: colors.status.error,
      fontWeight: '600',
    },

    hintsPanel: {
      gap: spacing.sm,
    },

    hintItem: {
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      backgroundColor: colors.status.warning + '0f',
      gap: spacing.sm,
    },

    hintItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },

    hintItemLabel: {
      color: colors.status.warning,
      fontWeight: '600',
    },
  });
