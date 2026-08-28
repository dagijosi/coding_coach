import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Pressable,
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
  ProgressBar,
  Screen,
} from '@/components/ui';
import { useToast } from '@/components/toast';

import { getLessonById } from '@/repositories/lessonRepository';
import { getConceptsByLesson } from '@/repositories/conceptRepository';
import { getProblemsByLesson } from '@/repositories/problemRepository';
import { getChallengesByLesson } from '@/repositories/challengeRepository';
import {
  completeLesson,
  recordChallengeAttempt,
  recordProblemAttempt,
  startLesson,
} from '@/repositories/progressRepository';

import type { Lesson, LessonContent } from '@/types/lesson';
import type {
  Challenge,
  Concept,
  Problem,
} from '@/types/learning';

import { executeChallenge } from '@/code/execution/executeChallenge';
import { getJavaScriptEngine } from '@/code/engine';
import type { CodeChallengeResult } from '@/code/types';
import { CodeEditor } from '@/components/code/CodeEditor';

import {
  animations,
  radius,
  shadows,
  spacing,
  typography,
  useTheme,
  useThemedStyles,
  type ThemeColors,
} from '@/theme';

type Step =
  | { kind: 'intro' }
  | { kind: 'concepts' }
  | { kind: 'learn' }
  | { kind: 'try-it' }
  | { kind: 'problem'; problem: Problem }
  | { kind: 'challenge'; challenge: Challenge }
  | { kind: 'complete' };

type TryItConfig = {
  starterCode: string;
  functionName: string;
  args: unknown[];
  hint: string;
};

const TRY_IT_BY_LESSON: Record<string, TryItConfig> = {
  'lesson-variables': {
    starterCode: `function describeTotal(base) {
  let total = base;
  total = total + 1;
  return 'Total is ' + total;
}`,
    functionName: 'describeTotal',
    args: [10],
    hint:
      'Experiment: edit the function body or change the value passed in, then press Run.',
  },
  'lesson-functions': {
    starterCode: `function sum(a, b) {
  return a + b;
}`,
    functionName: 'sum',
    args: [3, 4],
    hint:
      'Try editing the numbers in sum(3, 4) or the function body, then press Run.',
  },
};

const DEFAULT_TRY_IT: TryItConfig = {
  starterCode: `function greet(name) {
  return 'Hello, ' + name + '!';
}`,
  functionName: 'greet',
  args: ['Dagi'],
  hint:
    'Edit the function or its input and press Run to see what it returns.',
};

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [engineStatus, setEngineStatus] = useState<
    'available' | 'unavailable' | 'initializing' | 'error'
  >('unavailable');

  const solvedProblems = useRef<Set<string>>(new Set());
  const passedChallenges = useRef<Set<string>>(new Set());
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (!id) return;

    const refreshEngineStatus = () =>
      setEngineStatus(getJavaScriptEngine().getStatus());
    refreshEngineStatus();
    const interval = setInterval(refreshEngineStatus, 750);

    Promise.all([
      getLessonById(id),
      getConceptsByLesson(id),
      getProblemsByLesson(id),
      getChallengesByLesson(id),
    ])
      .then(([lessonData, conceptsData, problemsData, challengesData]) => {
        if (!lessonData) {
          setLoadError(true);
          return;
        }
        setLesson(lessonData);
        setConcepts(conceptsData);
        setProblems(problemsData);
        setChallenges(challengesData);
        startLesson(lessonData.id).catch(() => {
          // Non-blocking.
        });
      })
      .catch(() => setLoadError(true))
      .finally(() => clearInterval(interval));

    return () => clearInterval(interval);
  }, [id]);

  const steps = useMemo<Step[]>(() => {
    if (!lesson) return [];

    const list: Step[] = [{ kind: 'intro' }];

    if (concepts.length > 0) {
      list.push({ kind: 'concepts' });
    }

    list.push({ kind: 'learn' });
    list.push({ kind: 'try-it' });

    for (const problem of problems) {
      list.push({ kind: 'problem', problem });
    }

    for (const challenge of challenges) {
      list.push({ kind: 'challenge', challenge });
    }

    list.push({ kind: 'complete' });

    return list;
  }, [lesson, concepts, problems, challenges]);

  const step = steps[currentIndex];

  const isGated = useMemo(() => {
    if (!step) return false;
    if (step.kind === 'problem') {
      return !solvedProblems.current.has(step.problem.id);
    }
    if (step.kind === 'challenge') {
      return !passedChallenges.current.has(step.challenge.id);
    }
    return false;
  }, [step, currentIndex]);

  const progress = steps.length > 0 ? (currentIndex + 1) / steps.length : 0;

  const goNext = useCallback(() => {
    setCurrentIndex((index) => Math.min(index + 1, steps.length - 1));
  }, [steps.length]);

  const goBack = useCallback(() => {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }, []);

  const onProblemSolved = useCallback(
    (problemId: string) => {
      solvedProblems.current.add(problemId);
      forceUpdate();
    },
    []
  );

  const onChallengePassed = useCallback(
    (challengeId: string) => {
      passedChallenges.current.add(challengeId);
      forceUpdate();
    },
    []
  );

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
            Couldn't load this lesson
          </AppText>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  if (!lesson || !step) {
    return (
      <Screen scroll={false}>
        <View style={styles.center}>
          <AppText muted>Loading lesson...</AppText>
        </View>
      </Screen>
    );
  }

  const handleFinish = async () => {
    try {
      const xp = await completeLesson(lesson.id);
      showToast(
        xp > 0 ? `Lesson complete! +${xp} XP` : 'Lesson complete!',
        'success'
      );
      setTimeout(() => router.back(), 650);
    } catch {
      showToast('Could not save your progress. Please try again.', 'error');
    }
  };

  return (
    <View style={styles.root}>
      {/* Fixed header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <IconButton name="arrow-back" onPress={() => router.back()} />

          <View style={styles.headerRight}>
            <AppText variant="caption" muted>
              Step {Math.min(currentIndex + 1, steps.length)} of {steps.length}
            </AppText>
            <Badge
              label={lesson.difficulty}
              variant={badgeVariant(lesson.difficulty)}
            />
          </View>
        </View>
        <View style={styles.progressWrap}>
          <ProgressBar progress={progress} />
        </View>
      </View>

      {/* Step body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <StepBody
          step={step}
          lesson={lesson}
          concepts={concepts}
          engineStatus={engineStatus}
          tryIt={getTryItConfig(lesson)}
          onProblemSolved={onProblemSolved}
          onChallengePassed={onChallengePassed}
        />
      </ScrollView>

      {/* Fixed footer */}
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}
      >
        {step.kind === 'complete' ? (
          <Button title="Finish Lesson" onPress={handleFinish} />
        ) : (
          <>
            {currentIndex > 0 && (
              <Button title="Back" variant="ghost" onPress={goBack} />
            )}
            <View style={styles.continue}>
              <Button
                title={isGated ? 'Solve to continue' : 'Continue'}
                disabled={isGated}
                onPress={goNext}
              />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step body
// ---------------------------------------------------------------------------

function StepBody({
  step,
  lesson,
  concepts,
  engineStatus,
  tryIt,
  onProblemSolved,
  onChallengePassed,
}: {
  step: Step;
  lesson: Lesson;
  concepts: Concept[];
  engineStatus: 'available' | 'unavailable' | 'initializing' | 'error';
  tryIt: TryItConfig;
  onProblemSolved: (problemId: string) => void;
  onChallengePassed: (challengeId: string) => void;
}) {
  switch (step.kind) {
    case 'intro':
      return <IntroStep lesson={lesson} />;
    case 'concepts':
      return <ConceptsStep concepts={concepts} />;
    case 'learn':
      return <LearnStep lesson={lesson} />;
    case 'try-it':
      return <TryItStep engineStatus={engineStatus} config={tryIt} />;
    case 'problem':
      return (
        <ProblemStep
          key={step.problem.id}
          problem={step.problem}
          onSolved={() => onProblemSolved(step.problem.id)}
        />
      );
    case 'challenge':
      return (
        <ChallengeStep
          key={step.challenge.id}
          challenge={step.challenge}
          engineStatus={engineStatus}
          onPassed={() => onChallengePassed(step.challenge.id)}
        />
      );
    case 'complete':
      return <CompleteStep lesson={lesson} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Intro
// ---------------------------------------------------------------------------

function IntroStep({ lesson }: { lesson: Lesson }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const accentColor = difficultyColor(lesson.difficulty, colors);

  return (
    <FadeInView style={styles.stepContent}>
      <View style={[styles.stepHero, { borderLeftColor: accentColor }]}>
        <AppText variant="h1">{lesson.title}</AppText>
        <AppText muted style={styles.stepHeroDesc}>
          {lesson.description}
        </AppText>

        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <View
              style={[
                styles.metadataIcon,
                { backgroundColor: accentColor + '22' },
              ]}
            >
              <Ionicons name="time-outline" size={16} color={accentColor} />
            </View>
            <AppText variant="bodySmall" muted>
              {lesson.estimatedMinutes} min
            </AppText>
          </View>

          <View style={styles.metadataItem}>
            <View
              style={[
                styles.metadataIcon,
                { backgroundColor: accentColor + '22' },
              ]}
            >
              <Ionicons name="code-slash-outline" size={16} color={accentColor} />
            </View>
            <AppText variant="bodySmall" muted>
              {lesson.language}
            </AppText>
          </View>
        </View>
      </View>

      <StepPrologue
        icon="play-circle-outline"
        title="Ready to learn?"
        text="You'll explore the core ideas, see examples, try some code yourself, and finish with a short exercise."
      />
    </FadeInView>
  );
}

// ---------------------------------------------------------------------------
// Concepts
// ---------------------------------------------------------------------------

function ConceptsStep({ concepts }: { concepts: Concept[] }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <FadeInView style={styles.stepContent}>
      <SectionTitle
        icon="layers-outline"
        title="Key concepts"
        subtitle={`${concepts.length} ideas you'll learn in this lesson`}
      />

      {concepts.map((concept, index) => (
        <View key={concept.id} style={styles.conceptCard}>
          <View
            style={[
              styles.conceptIndex,
              { backgroundColor: colors.accent.soft },
            ]}
          >
            <AppText variant="bodySmall" style={styles.conceptIndexText}>
              {index + 1}
            </AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="h3">{concept.name}</AppText>
            <AppText variant="bodySmall" muted style={styles.conceptSummary}>
              {concept.summary}
            </AppText>
          </View>
        </View>
      ))}

      <StepPrologue
        icon="arrow-down-circle-outline"
        title="Let's dig in"
        text="Continue to read through this lesson's explanations and examples."
      />
    </FadeInView>
  );
}

// ---------------------------------------------------------------------------
// Learn
// ---------------------------------------------------------------------------

function LearnStep({ lesson }: { lesson: Lesson }) {
  const styles = useThemedStyles(makeStyles);

  return (
    <FadeInView style={styles.stepContent}>
      <SectionTitle
        icon="book-outline"
        title="Lesson content"
        subtitle="Read through the explanations and examples below."
      />

      {lesson.content.map((block, index) => (
        <LessonBlock key={index} block={block} />
      ))}

      <StepPrologue
        icon="flask-outline"
        title="Try it yourself"
        text="Next, experiment with this lesson's code in a live editor."
      />
    </FadeInView>
  );
}

// ---------------------------------------------------------------------------
// Try it
// ---------------------------------------------------------------------------

function TryItStep({
  engineStatus,
  config,
}: {
  engineStatus: 'available' | 'unavailable' | 'initializing' | 'error';
  config: TryItConfig;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [code, setCode] = useState(config.starterCode);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    setCode(config.starterCode);
    setOutput(null);
  }, [config]);

  const run = async () => {
    setRunning(true);
    setOutput(null);

    const engine = getJavaScriptEngine();
    const result = await engine.executeFunction({
      code,
      functionName: config.functionName,
      args: config.args,
      timeoutMs: 2000,
    });

    if (result.status === 'success') {
      setOutput({
        ok: true,
        text: JSON.stringify(result.value),
      });
    } else {
      setOutput({ ok: false, text: result.error });
    }

    setRunning(false);
  };

  return (
    <FadeInView style={styles.stepContent}>
      <SectionTitle
        icon="flask-outline"
        title="Try it"
        subtitle={config.hint}
      />

      <View style={styles.editorContainer}>
        <View style={styles.editorHeader}>
          <AppText variant="caption" style={styles.editorLang}>
            JavaScript
          </AppText>
          <EngineBadge status={engineStatus} compact />
        </View>
        <CodeEditor value={code} onChangeText={setCode} minHeight={180} />
      </View>

      <Button
        title={running ? 'Running...' : 'Run Code'}
        loading={running}
        disabled={running}
        onPress={run}
      />

      {output && (
        <View
          style={[
            styles.outputCard,
            output.ok ? styles.outputOk : styles.outputErr,
          ]}
        >
          <View style={styles.outputHeader}>
            <Ionicons
              name={output.ok ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={output.ok ? colors.status.success : colors.status.error}
            />
            <AppText
              variant="bodySmall"
              style={{ color: output.ok ? colors.status.success : colors.status.error, fontWeight: '600' }}
            >
              {config.functionName}() returned
            </AppText>
          </View>
          <AppText variant="code" style={styles.outputText}>
            {output.text}
          </AppText>
        </View>
      )}

      <StepPrologue
        icon="bulb-outline"
        title="Now practice"
        text="Continue to answer a short question to check your understanding."
      />
    </FadeInView>
  );
}

// ---------------------------------------------------------------------------
// Problem (inline multiple-choice)
// ---------------------------------------------------------------------------

function ProblemStep({
  problem,
  onSolved,
}: {
  problem: Problem;
  onSolved: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { showToast } = useToast();

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [wrongGuess, setWrongGuess] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [checking, setChecking] = useState(false);

  const correct = selected === problem.answer && submitted;
  const hint = showHint && problem.hints.length > 0 ? problem.hints[0] : null;

  const handleCheck = async () => {
    if (selected === null || problem.answer === undefined) return;

    setChecking(true);
    setWrongGuess(false);
    const isCorrect = selected === problem.answer;

    try {
      const xp = await recordProblemAttempt({
        problemId: problem.id,
        answer: selected,
        correct: isCorrect,
      });

      if (isCorrect) {
        setSubmitted(true);
        showToast(
          xp > 0 ? `Correct! +${xp} XP` : 'Correct!',
          'xp'
        );
        onSolved();
      } else {
        setWrongGuess(true);
        showToast('Not quite — try again', 'info');
      }
    } catch {
      showToast('Could not record your answer. Try again.', 'error');
    } finally {
      setChecking(false);
    }
  };

  return (
    <FadeInView style={styles.stepContent}>
      <SectionTitle
        icon="help-circle-outline"
        title={problem.title}
        subtitle={problem.type.replace('-', ' ')}
      />

      <Card>
        <AppText variant="bodySmall" muted style={styles.problemDesc}>
          {problem.description}
        </AppText>
      </Card>

      {problem.prompt ? (
        <View style={styles.codeCard}>
          <View style={styles.codeHeader}>
            <Ionicons name="code-slash" size={13} color={colors.accent.secondary} />
            <AppText variant="caption" style={styles.codeLangText}>
              {problem.type.replace('-', ' ')}
            </AppText>
          </View>
          <View style={styles.code}>
            <AppText variant="code">{problem.prompt}</AppText>
          </View>
        </View>
      ) : null}

      {problem.choices ? (
        <View style={styles.choices}>
          {problem.choices.map((choice, index) => {
            const isSelected = selected === index;
            const isCorrectShown = submitted && index === problem.answer;
            const isWrongPick = submitted && isSelected && index !== problem.answer;

            return (
              <PressableChoice
                key={`${index}-${choice}`}
                label={choice}
                letter={String.fromCharCode(65 + index)}
                state={
                  isCorrectShown
                    ? 'correct'
                    : isWrongPick
                    ? 'wrong'
                    : isSelected
                    ? 'selected'
                    : 'idle'
                }
                disabled={submitted}
                onPress={() => {
                  if (!submitted) {
                    setWrongGuess(false);
                    setSelected(index);
                  }
                }}
              />
            );
          })}
        </View>
      ) : null}

      {!submitted && problem.hints.length > 0 && (
        <View>
          <Button
            title={showHint ? 'Hide Hint' : 'Show Hint'}
            variant="ghost"
            onPress={() => setShowHint((v) => !v)}
          />
          {hint ? (
            <View style={styles.hintCard}>
              <View style={styles.hintHeader}>
                <Ionicons name="bulb-outline" size={16} color={colors.status.warning} />
                <AppText variant="h3" style={styles.hintTitle}>
                  Hint
                </AppText>
              </View>
              <AppText variant="bodySmall" style={styles.hintBody}>
                {hint.content}
              </AppText>
            </View>
          ) : null}
        </View>
      )}

      {!submitted && wrongGuess && (
        <FeedbackBanner
          correct={false}
          explanation={problem.explanation}
          retry
        />
      )}

      {!submitted && selected !== null && (
        <Button title="Check Answer" loading={checking} onPress={handleCheck} />
      )}

      {submitted && correct && (
        <StepPrologue
          icon="arrow-forward-circle-outline"
          title="Great work!"
          text="Continue to the next part of the lesson."
        />
      )}
    </FadeInView>
  );
}

// ---------------------------------------------------------------------------
// Challenge (inline code-writing)
// ---------------------------------------------------------------------------

function ChallengeStep({
  challenge,
  engineStatus,
  onPassed,
}: {
  challenge: Challenge;
  engineStatus: 'available' | 'unavailable' | 'initializing' | 'error';
  onPassed: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { showToast } = useToast();

  const [code, setCode] = useState(challenge.starterCode);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CodeChallengeResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    setCode(challenge.starterCode);
    setResult(null);
    setPassed(false);
    setShowHint(false);
  }, [challenge]);

  const tests = useMemo(
    () =>
      challenge.testCases.map((tc) => ({
        id: tc.id,
        args: tc.args,
        expected: tc.expected,
      })),
    [challenge]
  );

  const hint =
    showHint && challenge.hints.length > 0 ? challenge.hints[0] : null;

  const run = async () => {
    setRunning(true);
    setResult(null);

    const challengeResult = await executeChallenge(
      code,
      challenge.functionName,
      tests
    );

    setResult(challengeResult);
    setRunning(false);

    if (challengeResult.passed) {
      setPassed(true);
      showToast(
        `All tests passed (${challengeResult.testsPassed}/${challengeResult.testsTotal})!`,
        'success'
      );
      recordChallengeAttempt({
        challengeId: challenge.id,
        testsPassed: challengeResult.testsPassed,
        testsTotal: challengeResult.testsTotal,
        passed: true,
      }).catch(() => {
        // Non-blocking.
      });
      onPassed();
    } else {
      showToast(
        `${challengeResult.testsPassed}/${challengeResult.testsTotal} tests passed`,
        'error'
      );
    }
  };

  return (
    <FadeInView style={styles.stepContent}>
      <SectionTitle
        icon="code-slash"
        title={challenge.title}
        subtitle="Write code and run it against the test cases below."
      />

      <Card>
        <AppText variant="bodySmall" muted style={styles.problemDesc}>
          {challenge.description}
        </AppText>
      </Card>

      <View style={styles.editorContainer}>
        <View style={styles.editorHeader}>
          <AppText variant="caption" style={styles.editorLang}>
            JavaScript
          </AppText>
          <EngineBadge status={engineStatus} compact />
        </View>
        <CodeEditor value={code} onChangeText={setCode} minHeight={180} />
      </View>

      <Button
        title={running ? 'Running...' : 'Run Code'}
        loading={running}
        disabled={running}
        onPress={run}
      />

      {!passed && challenge.hints.length > 0 && (
        <View>
          <Button
            title={showHint ? 'Hide Hint' : 'Show Hint'}
            variant="ghost"
            onPress={() => setShowHint((v) => !v)}
          />
          {hint ? (
            <View style={styles.hintCard}>
              <View style={styles.hintHeader}>
                <Ionicons name="bulb-outline" size={16} color={colors.status.warning} />
                <AppText variant="h3" style={styles.hintTitle}>
                  Hint
                </AppText>
              </View>
              <AppText variant="bodySmall" style={styles.hintBody}>
                {hint.content}
              </AppText>
            </View>
          ) : null}
        </View>
      )}

      <Card>
        <AppText variant="h3">Test Cases</AppText>
        <View style={styles.tests}>
          {challenge.testCases.map((test, index) => {
            const testResult = result?.tests.find(
              (t) => t.testCaseId === test.id
            );
            return (
              <TestCaseRow
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

      {result && (
        <View
          style={[
            styles.challengeResult,
            result.passed ? styles.challengePass : styles.challengeFail,
          ]}
        >
          <View style={styles.outputHeader}>
            <Ionicons
              name={result.passed ? 'trophy' : 'alert-circle'}
              size={20}
              color={result.passed ? colors.status.success : colors.status.error}
            />
            <AppText
              variant="h3"
              style={{ color: result.passed ? colors.status.success : colors.status.error }}
            >
              {result.passed ? 'All tests passed!' : 'Not quite yet'}
            </AppText>
          </View>
          <AppText variant="bodySmall" muted>
            {result.passed
              ? `You passed ${result.testsPassed} of ${result.testsTotal} tests.`
              : `${result.testsPassed} of ${result.testsTotal} tests passed. Check the outputs above and try again.`}
          </AppText>
        </View>
      )}

      {passed && (
        <StepPrologue
          icon="arrow-forward-circle-outline"
          title="Challenge complete!"
          text="You've solved this challenge. Continue when you're ready."
        />
      )}
    </FadeInView>
  );
}

// ---------------------------------------------------------------------------
// Complete
// ---------------------------------------------------------------------------

function CompleteStep({ lesson }: { lesson: Lesson }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <FadeInView style={styles.stepContent}>
      <View style={styles.completeCard}>
        <View
          style={[
            styles.completeIcon,
            { backgroundColor: colors.accent.soft },
          ]}
        >
          <Ionicons name="ribbon" size={40} color={colors.accent.primary} />
        </View>

        <AppText variant="h1" style={styles.completeTitle}>
          You finished {lesson.title}!
        </AppText>

        <AppText variant="body" muted style={styles.completeText}>
          Nice work getting through this lesson. Marking it complete rewards
          you with XP and tracks your progress.
        </AppText>

        <View style={styles.completeRow}>
          <View style={styles.completeStat}>
            <Ionicons name="star" size={20} color={colors.status.success} />
            <AppText variant="h2">+50</AppText>
            <AppText variant="caption" muted>
              XP
            </AppText>
          </View>
        </View>
      </View>
    </FadeInView>
  );
}

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.sectionTitle}>
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={20} color={colors.accent.primary} />
        <AppText variant="h2">{title}</AppText>
      </View>
      {subtitle ? (
        <AppText variant="bodySmall" muted>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

function StepPrologue({
  icon,
  title,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.prologue}>
      <View style={[styles.prologueIcon, { backgroundColor: colors.accent.soft }]}>
        <Ionicons name={icon} size={20} color={colors.accent.primary} />
      </View>
      <View style={styles.flex}>
        <AppText variant="h3">{title}</AppText>
        <AppText variant="bodySmall" muted>
          {text}
        </AppText>
      </View>
    </View>
  );
}

function LessonBlock({ block }: { block: LessonContent }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  switch (block.type) {
    case 'heading':
      return (
        <View style={styles.block}>
          <AppText variant="h3">{block.content}</AppText>
        </View>
      );
    case 'text':
      return (
        <View style={styles.block}>
          <AppText variant="body" style={styles.textBlock}>
            {block.content}
          </AppText>
        </View>
      );
    case 'code':
      return (
        <View style={styles.block}>
          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <View style={styles.codeLang}>
                <Ionicons name="code-slash" size={13} color={colors.accent.secondary} />
                <AppText variant="caption" style={styles.codeLangText}>
                  {block.language ?? 'code'}
                </AppText>
              </View>
            </View>
            <View style={styles.code}>
              <AppText variant="code">{block.content}</AppText>
            </View>
          </View>
        </View>
      );
    default:
      return null;
  }
}

function EngineBadge({
  status,
  compact,
}: {
  status: 'available' | 'unavailable' | 'initializing' | 'error';
  compact?: boolean;
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
  return <Badge label={compact ? 'Offline' : 'Engine: Offline'} variant="warning" />;
}

function PressableChoice({
  label,
  letter,
  state,
  disabled,
  onPress,
}: {
  label: string;
  letter: string;
  state: 'idle' | 'selected' | 'correct' | 'wrong';
  disabled?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const background = {
    idle: colors.surface.secondary,
    selected: hexWithAlpha(colors.accent.primary, 0.14),
    correct: hexWithAlpha(colors.status.success, 0.16),
    wrong: hexWithAlpha(colors.status.error, 0.14),
  }[state];

  const borderColor = {
    idle: colors.border.default,
    selected: colors.accent.primary,
    correct: colors.status.success,
    wrong: colors.status.error,
  }[state];

  const tint = {
    idle: colors.text.muted,
    selected: colors.accent.primary,
    correct: colors.status.success,
    wrong: colors.status.error,
  }[state];

  const icon =
    state === 'correct' ? 'checkmark' : state === 'wrong' ? 'close' : null;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.choice,
        { backgroundColor: background, borderColor },
        pressed && !disabled && styles.choicePressed,
      ]}
    >
      <View style={[styles.choiceLetter, { backgroundColor: tint + '1f' }]}>
        <AppText variant="bodySmall" style={{ color: tint, fontWeight: '700' }}>
          {letter}
        </AppText>
      </View>
      <AppText variant="body" style={styles.choiceLabel}>
        {label}
      </AppText>
      {icon ? (
        <Ionicons name={icon} size={18} color={tint} />
      ) : (
        <View
          style={[
            styles.choiceRadio,
            { borderColor: state === 'selected' ? colors.accent.primary : colors.border.strong },
          ]}
        />
      )}
    </Pressable>
  );
}

function FeedbackBanner({
  correct,
  explanation,
  retry,
}: {
  correct: boolean;
  explanation: string;
  retry?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: animations.normal,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: animations.fast,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, opacity]);

  return (
    <Animated.View
      style={[
        styles.feedback,
        correct ? styles.feedbackCorrect : styles.feedbackWrong,
        { opacity, transform: [{ scale }] },
      ]}
    >
      <View style={styles.outputHeader}>
        <Ionicons
          name={correct ? 'checkmark-circle' : 'close-circle'}
          size={20}
          color={correct ? colors.status.success : colors.status.error}
        />
        <AppText variant="h3" style={{ color: correct ? colors.status.success : colors.status.error }}>
          {correct ? 'Correct!' : 'Not quite'}
        </AppText>
      </View>
      <AppText variant="bodySmall" style={styles.feedbackBody}>
        {explanation}
      </AppText>
      {retry && (
        <AppText variant="caption" muted>
          Review the explanation, then pick another answer to try again.
        </AppText>
      )}
    </Animated.View>
  );
}

function TestCaseRow({
  index,
  args,
  expected,
  result,
}: {
  index: number;
  args: unknown[];
  expected: unknown;
  result?: CodeChallengeResult['tests'][number];
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
        <AppText variant="bodySmall" style={{ color, fontWeight: '600' }}>
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
            color: result!.passed ? colors.status.success : colors.text.secondary,
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTryItConfig(lesson: Lesson): TryItConfig {
  return TRY_IT_BY_LESSON[lesson.id] ?? DEFAULT_TRY_IT;
}

function badgeVariant(difficulty: Lesson['difficulty']) {
  if (difficulty === 'hard') return 'error' as const;
  if (difficulty === 'medium') return 'warning' as const;
  return 'success' as const;
}

function difficultyColor(
  difficulty: Lesson['difficulty'],
  colors: ThemeColors
): string {
  if (difficulty === 'hard') return colors.difficulty.hard;
  if (difficulty === 'medium') return colors.difficulty.medium;
  return colors.difficulty.easy;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const value = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${value}`;
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
      backgroundColor: colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.sm,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xs,
    },

    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    progressWrap: {
      paddingHorizontal: spacing.xs,
      marginTop: spacing.sm,
    },

    body: {
      flex: 1,
    },

    bodyContent: {
      padding: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxl,
    },

    stepContent: {
      gap: spacing.md,
    },

    footer: {
      paddingTop: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.background.primary,
      borderTopWidth: 1,
      borderTopColor: colors.border.default,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    continue: {
      flex: 1,
    },

    stepHero: {
      padding: spacing.lg,
      borderLeftWidth: 3,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.lg,
      ...shadows.medium,
    },

    stepHeroDesc: {
      marginTop: spacing.sm,
    },

    metadata: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginTop: spacing.lg,
    },

    metadataItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    metadataIcon: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },

    sectionTitle: {
      gap: spacing.xs,
    },

    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    conceptCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    conceptIndex: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },

    conceptIndexText: {
      color: colors.accent.primary,
      fontWeight: '700',
    },

    conceptSummary: {
      marginTop: spacing.xs,
    },

    prologue: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.surface.secondary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    prologueIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },

    block: {},

    textBlock: {
      color: colors.text.secondary,
      lineHeight: typography.body.lineHeight,
    },

    codeCard: {
      backgroundColor: colors.background.secondary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      overflow: 'hidden',
    },

    codeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.default,
      backgroundColor: colors.background.tertiary,
    },

    codeLang: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },

    codeLangText: {
      color: colors.accent.secondary,
      fontWeight: '600',
    },

    code: {
      padding: spacing.md,
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

    outputCard: {
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: spacing.sm,
    },

    outputOk: {
      borderColor: hexWithAlpha(colors.status.success, 0.6),
      backgroundColor: hexWithAlpha(colors.status.success, 0.08),
    },

    outputErr: {
      borderColor: hexWithAlpha(colors.status.error, 0.6),
      backgroundColor: hexWithAlpha(colors.status.error, 0.08),
    },

    outputHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    outputText: {
      color: colors.text.primary,
    },

    problemDesc: {
      lineHeight: 22,
    },

    choices: {
      gap: spacing.sm,
    },

    choice: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
    },

    choicePressed: {
      opacity: 0.85,
      transform: [{ scale: 0.99 }],
    },

    choiceLetter: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },

    choiceLabel: {
      flex: 1,
      color: colors.text.primary,
    },

    choiceRadio: {
      width: 18,
      height: 18,
      borderRadius: radius.full,
      borderWidth: 2,
    },

    hintCard: {
      marginTop: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
      backgroundColor: hexWithAlpha(colors.status.warning, 0.08),
      gap: spacing.sm,
    },

    hintHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    hintTitle: {
      color: colors.status.warning,
    },

    hintBody: {
      color: colors.text.secondary,
    },

    feedback: {
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: spacing.sm,
    },

    feedbackCorrect: {
      borderColor: hexWithAlpha(colors.status.success, 0.6),
      backgroundColor: hexWithAlpha(colors.status.success, 0.08),
    },

    feedbackWrong: {
      borderColor: hexWithAlpha(colors.status.error, 0.6),
      backgroundColor: hexWithAlpha(colors.status.error, 0.08),
    },

    feedbackBody: {
      color: colors.text.secondary,
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

    challengeResult: {
      padding: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      gap: spacing.sm,
    },

    challengePass: {
      borderColor: hexWithAlpha(colors.status.success, 0.6),
      backgroundColor: hexWithAlpha(colors.status.success, 0.08),
    },

    challengeFail: {
      borderColor: hexWithAlpha(colors.status.error, 0.6),
      backgroundColor: hexWithAlpha(colors.status.error, 0.08),
    },

    completeCard: {
      alignItems: 'center',
      padding: spacing.xl,
      paddingVertical: spacing.xxl,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      gap: spacing.md,
    },

    completeIcon: {
      width: 84,
      height: 84,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },

    completeTitle: {
      textAlign: 'center',
    },

    completeText: {
      textAlign: 'center',
      color: colors.text.secondary,
    },

    completeRow: {
      flexDirection: 'row',
      gap: spacing.lg,
    },

    completeStat: {
      alignItems: 'center',
      gap: 2,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface.secondary,
    },

    flex: {
      flex: 1,
    },
  });
