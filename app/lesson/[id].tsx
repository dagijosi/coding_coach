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
  ConfettiBurst,
  FadeInView,
  IconButton,
  ProgressBar,
  Screen,
} from '@/components/ui';
import { useToast } from '@/components/toast';
import { useSessionStore } from '@/store/sessionStore';
import { checkAndUnlockAchievements } from '@/features/achievements/achievementService';
import { scheduleInitialReview } from '@/learning/srs/reviewService';

import { getLessonById } from '@/repositories/lessonRepository';
import { getTopicById } from '@/repositories/topicRepository';
import { getConceptsByLesson } from '@/repositories/conceptRepository';
import { getProblemsByLesson } from '@/repositories/problemRepository';
import { getChallengesByLesson } from '@/repositories/challengeRepository';
import {
  completeLesson,
  getLessonProgressById,
  recordChallengeAttempt,
  recordProblemAttempt,
  startLesson,
  updateLessonStep,
} from '@/repositories/progressRepository';

import type { Lesson, LessonContent } from '@/types/lesson';
import type {
  Challenge,
  Concept,
  Problem,
} from '@/types/learning';

import { executeChallenge } from '@/code/execution/executeChallenge';
import { getJavaScriptEngine } from '@/code/engine';
import {
  getLanguageDescriptor,
  type QuickSnippet,
} from '@/code/languages/languageRegistry';
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

type TryItParam = {
  name: string;
  label: string;
  defaultValue: unknown;
  type?: 'number' | 'string' | 'boolean';
  options?: unknown[];
  min?: number;
  max?: number;
  step?: number;
};

type TryItMiniGoal = {
  description: string;
  check: (result: unknown, args: unknown[]) => boolean;
};

type TryItConfig = {
  starterCode: string;
  functionName: string;
  args: unknown[];
  params?: TryItParam[];
  hint: string;
  conceptNote?: string;
  miniGoal?: TryItMiniGoal;
  quickSnippets?: Array<{ label: string; insert: string }>;
  explanationTemplate?: (args: unknown[], result: unknown) => string;
};

const DEFAULT_SNIPPETS = [
  { label: '+ 5', insert: ' + 5' },
  { label: '* 2', insert: ' * 2' },
  { label: 'log()', insert: "\n  console.log('Value is:', total);" },
  { label: 'return', insert: 'return ' },
  { label: 'let', insert: 'let ' },
  { label: '""', insert: "''" },
  { label: '===', insert: ' === ' },
];

const PYTHON_DEFAULT_SNIPPETS: QuickSnippet[] = [
  { label: 'def', insert: 'def ' },
  { label: 'return', insert: 'return ' },
  { label: 'print()', insert: "\n    print('Value is:', result)" },
  { label: 'range()', insert: 'range(1, 10)' },
  { label: 'len()', insert: 'len(' },
  { label: 'if', insert: 'if ' },
  { label: 'in', insert: ' in ' },
  { label: '""', insert: '""' },
];

const TRY_IT_BY_LESSON: Record<string, TryItConfig> = {
  'lesson-variables': {
    starterCode: `function describeTotal(base) {
  // 'total' is a variable initialized with the input value 'base'
  let total = base;

  // We reassign 'total' by adding 1 to its current value
  total = total + 1;

  // Log to console for live inspection
  console.log('Inside describeTotal, total is:', total);

  // Return the final result as a friendly text string
  return 'Total is ' + total;
}`,
    functionName: 'describeTotal',
    args: [10],
    params: [
      {
        name: 'base',
        label: 'Input Value (base)',
        defaultValue: 10,
        type: 'number',
        min: 0,
        max: 100,
        step: 5,
        options: [5, 10, 20, 50],
      },
    ],
    hint: 'Experiment: Change the input number below or edit the function body, then press Run.',
    conceptNote: 'Variables hold values that you can use and update. The parameter "base" receives the number passed into describeTotal(base).',
    miniGoal: {
      description: 'Make describeTotal return a result of 25 or more',
      check: (result) => {
        if (typeof result === 'string') {
          const match = result.match(/\d+/);
          return match ? parseInt(match[0], 10) >= 25 : false;
        }
        return typeof result === 'number' ? result >= 25 : false;
      },
    },
    quickSnippets: [
      { label: '+ 5', insert: ' + 5' },
      { label: '* 2', insert: ' * 2' },
      { label: 'log(total)', insert: "\n  console.log('Current total:', total);" },
      { label: '+ " bonus"', insert: ' + " (bonus)"' },
      { label: 'let bonus = 10;', insert: '\n  let bonus = 10;\n  total = total + bonus;' },
    ],
    explanationTemplate: (args, result) =>
      `Ran describeTotal(base = ${JSON.stringify(args[0])}) with your code -> Result returned: ${JSON.stringify(result)}`,
  },
  'lesson-functions': {
    starterCode: `function sum(a, b) {
  // 'a' and 'b' are parameters passed into this function
  console.log('Adding', a, 'and', b);
  return a + b;
}`,
    functionName: 'sum',
    args: [3, 4],
    params: [
      { name: 'a', label: 'First number (a)', defaultValue: 3, type: 'number', min: 0, max: 50, step: 1, options: [1, 3, 5, 10] },
      { name: 'b', label: 'Second number (b)', defaultValue: 4, type: 'number', min: 0, max: 50, step: 1, options: [2, 4, 8, 20] },
    ],
    hint: 'Try selecting different input numbers or modifying the calculation inside sum(a, b), then press Run.',
    conceptNote: 'Functions take input values (arguments) and return a calculated result.',
    miniGoal: {
      description: 'Make sum(a, b) return 20 or more',
      check: (result) => typeof result === 'number' && result >= 20,
    },
    quickSnippets: [
      { label: '* 2', insert: ' * 2' },
      { label: '+ 10', insert: ' + 10' },
      { label: 'log(a, b)', insert: "\n  console.log('Inputs:', a, b);" },
      { label: 'return (a + b) * 2;', insert: 'return (a + b) * 2;' },
    ],
    explanationTemplate: (args, result) =>
      `Ran sum(${JSON.stringify(args[0])}, ${JSON.stringify(args[1])}) with your code -> Result returned: ${JSON.stringify(result)}`,
  },
  // Python Lessons
  'lesson-py-variables': {
    starterCode: `def celsius_to_fahrenheit(c):
    # Convert Celsius to Fahrenheit
    print("Converting Celsius value:", c)
    fahrenheit = (c * 9/5) + 32
    return fahrenheit`,
    functionName: 'celsius_to_fahrenheit',
    args: [25],
    params: [
      { name: 'c', label: 'Celsius (°C)', defaultValue: 25, type: 'number', min: -40, max: 100, step: 5, options: [0, 25, 37, 100] },
    ],
    hint: 'Experiment with different Celsius temperatures or tweak the formula, then press Run.',
    conceptNote: 'Python variables are dynamically typed. Functions use def and indentation.',
    miniGoal: {
      description: 'Convert a temperature to get over 100°F (try 38°C or more)',
      check: (result) => typeof result === 'number' && result >= 100,
    },
    quickSnippets: [
      { label: '+ 32', insert: ' + 32' },
      { label: '* 9/5', insert: ' * (9/5)' },
      { label: 'print(c)', insert: '\n    print("Input c is:", c)' },
      { label: 'round()', insert: 'round(fahrenheit, 1)' },
    ],
    explanationTemplate: (args, result) =>
      `Ran celsius_to_fahrenheit(c = ${JSON.stringify(args[0])}) -> Result: ${JSON.stringify(result)}°F`,
  },
  'lesson-py-strings': {
    starterCode: `def is_palindrome(s):
    # Palindrome checker in Python
    cleaned = s.lower()
    print("Checking text:", cleaned)
    return cleaned == cleaned[::-1]`,
    functionName: 'is_palindrome',
    args: ['racecar'],
    params: [
      { name: 's', label: 'Text string', defaultValue: 'racecar', type: 'string', options: ['racecar', 'Madam', 'python', 'level'] },
    ],
    hint: 'Try different words or expressions. In Python, s[::-1] slices a string backwards.',
    conceptNote: 'Python strings support slicing, methods like .lower(), and reversal with [::-1].',
    miniGoal: {
      description: 'Test a word that returns True for palindrome check',
      check: (result) => result === true,
    },
    quickSnippets: [
      { label: '[::-1]', insert: '[::-1]' },
      { label: '.lower()', insert: '.lower()' },
      { label: '.upper()', insert: '.toUpperCase()' },
      { label: 'len(s)', insert: 'len(s)' },
    ],
    explanationTemplate: (args, result) =>
      `Ran is_palindrome(${JSON.stringify(args[0])}) -> Returns: ${JSON.stringify(result)}`,
  },
  'lesson-py-control-flow': {
    starterCode: `def fizzbuzz(n):
    # Generates a list of FizzBuzz values from 1 to n
    result = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            result.append("FizzBuzz")
        elif i % 3 == 0:
            result.append("Fizz")
        elif i % 5 == 0:
            result.append("Buzz")
        else:
            result.append(i)
    return result`,
    functionName: 'fizzbuzz',
    args: [15],
    params: [
      { name: 'n', label: 'Limit (n)', defaultValue: 15, type: 'number', min: 1, max: 30, step: 1, options: [5, 10, 15, 20] },
    ],
    hint: 'Change the limit n and run to see the generated FizzBuzz list.',
    conceptNote: 'Python uses if / elif / else blocks and range() for iterative loops.',
    miniGoal: {
      description: 'Run fizzbuzz with n >= 15 to include "FizzBuzz"',
      check: (result) => Array.isArray(result) && result.includes('FizzBuzz'),
    },
    quickSnippets: [
      { label: 'range(1, n+1)', insert: 'range(1, n + 1)' },
      { label: '.append()', insert: '.append()' },
      { label: '% 3 == 0', insert: ' % 3 == 0' },
      { label: '% 5 == 0', insert: ' % 5 == 0' },
    ],
    explanationTemplate: (args, result) =>
      `Ran fizzbuzz(n = ${JSON.stringify(args[0])}) -> Output: ${JSON.stringify(result)}`,
  },
  'lesson-py-lists': {
    starterCode: `def double_numbers(nums):
    # List comprehension in Python
    print("Original numbers:", nums)
    return [x * 2 for x in nums]`,
    functionName: 'double_numbers',
    args: [[1, 2, 3, 4, 5]],
    params: [
      { name: 'nums', label: 'List of numbers', defaultValue: [1, 2, 3, 4, 5], type: 'string', options: [[1, 2, 3], [5, 10, 15], [2, 4, 6, 8]] },
    ],
    hint: 'List comprehensions [expr for item in list] allow concise data transformations.',
    conceptNote: 'Python lists are mutable sequences supporting indexing, appending, and comprehensions.',
    miniGoal: {
      description: 'Produce a list where the maximum number is 20 or higher',
      check: (result) => Array.isArray(result) && result.some((x) => typeof x === 'number' && x >= 20),
    },
    quickSnippets: [
      { label: '[x * 3 for x in nums]', insert: '[x * 3 for x in nums]' },
      { label: 'sum(nums)', insert: 'sum(nums)' },
      { label: 'len(nums)', insert: 'len(nums)' },
    ],
    explanationTemplate: (args, result) =>
      `Ran double_numbers(${JSON.stringify(args[0])}) -> Output: ${JSON.stringify(result)}`,
  },
};

const DEFAULT_TRY_IT: TryItConfig = {
  starterCode: `function greet(name) {
  // Returns a customized greeting string
  console.log('Greeting user:', name);
  return 'Hello, ' + name + '!';
}`,
  functionName: 'greet',
  args: ['Dagi'],
  params: [
    { name: 'name', label: 'Name (string)', defaultValue: 'Dagi', type: 'string', options: ['Dagi', 'Alex', 'Coder', 'World'] },
  ],
  hint: 'Edit the function or choose different input values and press Run to see what it returns.',
  conceptNote: 'Experiment with the code editor and watch live evaluation in action.',
  miniGoal: {
    description: 'Customize the greeting to return a friendly welcome message',
    check: (result) => typeof result === 'string' && result.length > 5,
  },
  quickSnippets: [
    { label: '+ " 🎉"', insert: ' + " 🎉"' },
    { label: '.toUpperCase()', insert: '.toUpperCase()' },
    { label: 'log(name)', insert: "\n  console.log('User name is:', name);" },
  ],
  explanationTemplate: (args, result) =>
    `Ran greet(${JSON.stringify(args[0])}) with your code -> Result returned: ${JSON.stringify(result)}`,
};

/**
 * Converts a stored `progress` fraction (0..1) back to a step index.
 * `updateLessonStep` stores (stepIndex + 1) / totalSteps, so the inverse
 * layout of the steps recovers the same index, clamped to valid bounds.
 */
function progressToIndex(progress: number, totalSteps: number): number {
  if (totalSteps <= 0) return 0;
  const index = Math.round(progress * totalSteps) - 1;
  return Math.max(0, Math.min(index, totalSteps - 1));
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [topicName, setTopicName] = useState<string | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [engineStatus, setEngineStatus] = useState<
    'available' | 'unavailable' | 'initializing' | 'error'
  >('unavailable');

  const [solvedProblemIds, setSolvedProblemIds] = useState<Set<string>>(new Set());
  const [passedChallengeIds, setPassedChallengeIds] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const didRestore = useRef(false);

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
      .then(async ([lessonData, conceptsData, problemsData, challengesData]) => {
        if (!lessonData) {
          setLoadError(true);
          return;
        }
        setLesson(lessonData);
        setConcepts(conceptsData);
        setProblems(problemsData);
        setChallenges(challengesData);

        if (lessonData.topicId) {
          getTopicById(lessonData.topicId)
            .then((t) => setTopicName(t?.name ?? null))
            .catch(() => {});
        }

        useSessionStore
          .getState()
          .setCurrentLesson({ id: lessonData.id, title: lessonData.title });
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
      return !solvedProblemIds.has(step.problem.id);
    }
    if (step.kind === 'challenge') {
      return !passedChallengeIds.has(step.challenge.id);
    }
    return false;
  }, [step, solvedProblemIds, passedChallengeIds]);

  const progress = steps.length > 0 ? (currentIndex + 1) / steps.length : 0;

  const goNext = useCallback(() => {
    setCurrentIndex((index) => Math.min(index + 1, steps.length - 1));
  }, [steps.length]);

  const goBack = useCallback(() => {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }, []);

  const onProblemSolved = useCallback(
    (problemId: string) => {
      setSolvedProblemIds((prev) => {
        const next = new Set(prev);
        next.add(problemId);
        return next;
      });
    },
    []
  );

  const onChallengePassed = useCallback(
    (challengeId: string) => {
      setPassedChallengeIds((prev) => {
        const next = new Set(prev);
        next.add(challengeId);
        return next;
      });
    },
    []
  );

  // Restore the learner's last position once the lesson content is ready.
  useEffect(() => {
    if (!lesson || steps.length === 0 || didRestore.current) return;

    getLessonProgressById(lesson.id)
      .then((saved) => {
        setCurrentIndex(
          progressToIndex(saved.progress, steps.length)
        );
        if (saved.status === 'completed') {
          setSolvedProblemIds(new Set(problems.map((p) => p.id)));
          setPassedChallengeIds(new Set(challenges.map((c) => c.id)));
        }
      })
      .catch(() => {
        // Not resumable — start from the beginning.
      })
      .finally(() => {
        didRestore.current = true;
      });
  }, [lesson, steps.length, problems, challenges]);

  // Persist the current step whenever the learner navigates.
  useEffect(() => {
    if (!lesson || steps.length === 0 || !didRestore.current) return;
    updateLessonStep(lesson.id, currentIndex, steps.length).catch(() => {
      // Non-blocking: step persistence must never interrupt the lesson.
    });
  }, [lesson, currentIndex, steps.length]);

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

  useEffect(() => {
    if (step?.kind === 'complete') {
      setShowConfetti(true);
      checkAndUnlockAchievements()
        .then((newly) => {
          if (newly.length > 0) {
            showToast(`🏆 Badge Unlocked: ${newly[0].title}!`, 'success');
          }
        })
        .catch(() => {});
    }
  }, [step?.kind]);

  const handleFinish = async () => {
    try {
      const xp = await completeLesson(lesson.id);
      showToast(
        xp > 0 ? `Lesson complete! +${xp} XP` : 'Lesson complete!',
        'success'
      );
      scheduleInitialReview(lesson.id, 'lesson').catch(() => {});
      checkAndUnlockAchievements()
        .then((newly) => {
          if (newly.length > 0) {
            showToast(`🏆 Badge Unlocked: ${newly[0].title}!`, 'success');
          }
        })
        .catch(() => {});
      setTimeout(() => router.back(), 700);
    } catch {
      showToast('Could not save your progress. Please try again.', 'error');
    }
  };

  return (
    <View style={styles.root}>
      {showConfetti && (
        <ConfettiBurst onComplete={() => setShowConfetti(false)} />
      )}
      {/* Fixed header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <IconButton name="arrow-back" onPress={() => router.back()} />

          <View style={styles.headerCenter}>
            <AppText variant="caption" muted numberOfLines={1} style={styles.breadcrumbText}>
              {topicName ? `${topicName} • ` : ''}{lesson.language.toUpperCase()}
            </AppText>
            <AppText variant="bodySmall" style={styles.headerLessonTitle} numberOfLines={1}>
              {lesson.title}
            </AppText>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={12} color={colors.text.muted} />
              <AppText variant="caption" muted style={styles.timeBadgeText}>
                {lesson.estimatedMinutes}m
              </AppText>
            </View>
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
      return <TryItStep engineStatus={engineStatus} config={tryIt} language={lesson.language} />;
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
          language={lesson.language}
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
        <View style={styles.heroBadgeRow}>
          <Badge label={lesson.difficulty.toUpperCase()} variant={badgeVariant(lesson.difficulty)} />
          <View style={styles.heroLangPill}>
            <Ionicons name="code-slash" size={12} color={colors.accent.primary} />
            <AppText variant="caption" style={styles.heroLangText}>
              {lesson.language}
            </AppText>
          </View>
        </View>

        <AppText variant="h1" style={styles.heroTitle}>{lesson.title}</AppText>
        <AppText variant="body" muted style={styles.stepHeroDesc}>
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
              {lesson.estimatedMinutes} min estimated
            </AppText>
          </View>
        </View>
      </View>

      <StepPrologue
        icon="play-circle-outline"
        title="Ready to learn?"
        text="You'll explore the core ideas, see live examples, experiment with code, and solve exercises."
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
  language,
}: {
  engineStatus: 'available' | 'unavailable' | 'initializing' | 'error';
  config: TryItConfig;
  language?: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { showToast } = useToast();

  const [code, setCode] = useState(config.starterCode);
  const [currentArgs, setCurrentArgs] = useState<unknown[]>(config.args);
  const [running, setRunning] = useState(false);
  const [goalMet, setGoalMet] = useState(false);
  const [output, setOutput] = useState<{
    ok: boolean;
    text: string;
    explanation?: string;
    evaluatedArgs: unknown[];
    logs?: string[];
    goalMet?: boolean;
  } | null>(null);

  useEffect(() => {
    setCode(config.starterCode);
    setCurrentArgs(config.args);
    setOutput(null);
    setGoalMet(false);
  }, [config]);

  const updateArg = (index: number, val: unknown) => {
    setCurrentArgs((prev) => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleResetCode = () => {
    setCode(config.starterCode);
    setCurrentArgs(config.args);
    setOutput(null);
    setGoalMet(false);
  };

  const insertSnippet = (snippet: string) => {
    setCode((prev) => {
      if (snippet.startsWith('\n')) {
        const lastReturn = prev.lastIndexOf('return');
        if (lastReturn !== -1) {
          return prev.slice(0, lastReturn) + snippet.trimStart() + '\n\n  ' + prev.slice(lastReturn);
        }
      }
      return prev + snippet;
    });
  };

  const run = async () => {
    setRunning(true);
    setOutput(null);

    const engine = getJavaScriptEngine();
    const argsToRun = currentArgs;
    const result = await engine.executeFunction({
      code,
      functionName: config.functionName,
      args: argsToRun,
      language,
      timeoutMs: 2000,
    });

    if (result.status === 'success') {
      const explanation = config.explanationTemplate
        ? config.explanationTemplate(argsToRun, result.value)
        : undefined;
      const isGoalMet = config.miniGoal
        ? config.miniGoal.check(result.value, argsToRun)
        : false;
      if (isGoalMet && !goalMet) {
        setGoalMet(true);
        showToast('🎯 Mini-Goal Completed! Great experimentation.', 'xp');
      }
      setOutput({
        ok: true,
        text: JSON.stringify(result.value),
        explanation,
        evaluatedArgs: argsToRun,
        logs: result.logs,
        goalMet: isGoalMet,
      });
    } else {
      setOutput({
        ok: false,
        text: result.error,
        evaluatedArgs: argsToRun,
        logs: result.logs,
      });
    }

    setRunning(false);
  };

  const callSignature = `${config.functionName}(${currentArgs
    .map((a) => JSON.stringify(a))
    .join(', ')})`;

  const langDesc = getLanguageDescriptor(language);
  const snippets = config.quickSnippets ?? langDesc.quickSnippets;
  const langLabel = langDesc.label;
  const langIcon = langDesc.icon;

  return (
    <FadeInView style={styles.stepContent}>
      <SectionTitle
        icon="flask-outline"
        title="Try it"
        subtitle={config.hint}
      />

      {/* Mini-Goal Target Banner */}
      {config.miniGoal && (
        <View
          style={[
            styles.miniGoalCard,
            goalMet && styles.miniGoalCardDone,
          ]}
        >
          <View style={styles.miniGoalHeader}>
            <Ionicons
              name={goalMet ? 'checkmark-circle' : 'flag-outline'}
              size={16}
              color={goalMet ? colors.status.success : colors.accent.primary}
            />
            <AppText
              variant="caption"
              style={[
                styles.miniGoalTag,
                { color: goalMet ? colors.status.success : colors.accent.primary },
              ]}
            >
              {goalMet ? 'MINI-GOAL ACHIEVED' : 'MINI-GOAL TARGET'}
            </AppText>
          </View>
          <AppText variant="bodySmall" style={styles.miniGoalDesc}>
            {config.miniGoal.description}
          </AppText>
        </View>
      )}

      {config.conceptNote ? (
        <View style={styles.conceptNoteBox}>
          <Ionicons name="information-circle-outline" size={18} color={colors.accent.primary} />
          <AppText variant="bodySmall" style={styles.conceptNoteText}>
            {config.conceptNote}
          </AppText>
        </View>
      ) : null}

      {/* Interactive Parameters Card */}
      {config.params && config.params.length > 0 && (
        <View style={styles.paramsCard}>
          <View style={styles.paramsHeader}>
            <Ionicons name="options-outline" size={16} color={colors.accent.primary} />
            <AppText variant="bodySmall" style={styles.paramsTitle}>
              Function Inputs (Arguments)
            </AppText>
          </View>

          <View style={styles.paramsList}>
            {config.params.map((param, pIdx) => {
              const currentVal = currentArgs[pIdx] ?? param.defaultValue;
              const isNumber = param.type === 'number';
              const numVal = Number(currentVal);

              return (
                <View key={param.name} style={styles.paramCard}>
                  <View style={styles.paramMeta}>
                    <AppText variant="caption" style={styles.paramName}>
                      {param.name}:
                    </AppText>
                    <AppText variant="caption" muted style={styles.paramLabel}>
                      {param.label}
                    </AppText>
                  </View>

                  <View style={styles.paramControlsRow}>
                    {isNumber && (
                      <View style={styles.stepperContainer}>
                        <Pressable
                          style={styles.stepperBtn}
                          onPress={() =>
                            updateArg(
                              pIdx,
                              Math.max(param.min ?? 0, numVal - (param.step ?? 1))
                            )
                          }
                        >
                          <Ionicons name="remove" size={14} color={colors.accent.primary} />
                        </Pressable>
                        <View style={styles.stepperDisplay}>
                          <AppText variant="caption" style={styles.stepperValText}>
                            {numVal}
                          </AppText>
                        </View>
                        <Pressable
                          style={styles.stepperBtn}
                          onPress={() =>
                            updateArg(
                              pIdx,
                              Math.min(param.max ?? 999, numVal + (param.step ?? 1))
                            )
                          }
                        >
                          <Ionicons name="add" size={14} color={colors.accent.primary} />
                        </Pressable>
                      </View>
                    )}

                    {param.options && param.options.length > 0 ? (
                      <View style={styles.paramOptions}>
                        {param.options.map((opt, optIdx) => {
                          const isSelected = currentVal === opt;
                          return (
                            <Pressable
                              key={`${optIdx}-${String(opt)}`}
                              onPress={() => updateArg(pIdx, opt)}
                              style={[
                                styles.paramPill,
                                isSelected && styles.paramPillActive,
                              ]}
                            >
                              <AppText
                                variant="caption"
                                style={[
                                  styles.paramPillText,
                                  isSelected && styles.paramPillTextActive,
                                ]}
                              >
                                {String(opt)}
                              </AppText>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Quick Insert Snippets Bar */}
      <View style={styles.snippetsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.snippetsScroll}
        >
          <View style={styles.snippetLabelBox}>
            <Ionicons name="flash-outline" size={12} color={colors.accent.primary} />
            <AppText variant="caption" style={styles.snippetLabel}>
              Insert:
            </AppText>
          </View>
          {snippets.map((snip, sIdx) => (
            <Pressable
              key={`${sIdx}-${snip.label}`}
              onPress={() => insertSnippet(snip.insert)}
              style={({ pressed }) => [
                styles.snippetChip,
                pressed && { opacity: 0.7 },
              ]}
            >
              <AppText variant="caption" style={styles.snippetChipText}>
                {snip.label}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Code Editor */}
      <View style={styles.editorContainer}>
        <View style={styles.editorHeader}>
          <View style={styles.editorHeaderLeft}>
            <Ionicons name={langIcon} size={13} color={langDesc.color} />
            <AppText variant="caption" style={[styles.editorLang, { color: langDesc.color }]}>
              {langLabel}
            </AppText>
            <AppText variant="caption" muted style={styles.callPreview} numberOfLines={1}>
              · will run {callSignature}
            </AppText>
          </View>
          <EngineBadge status={engineStatus} compact />
        </View>
        <CodeEditor value={code} onChangeText={setCode} minHeight={180} />
      </View>

      {/* Actions */}
      <View style={styles.tryItActions}>
        <View style={styles.tryItMainBtn}>
          <Button
            title={running ? 'Running...' : 'Run Code'}
            loading={running}
            disabled={running}
            onPress={run}
          />
        </View>
        <Button
          title="Reset"
          variant="secondary"
          disabled={running}
          onPress={handleResetCode}
        />
      </View>

      {/* Output Card */}
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
              style={{
                color: output.ok ? colors.status.success : colors.status.error,
                fontWeight: '600',
              }}
            >
              {config.functionName}(
              {output.evaluatedArgs.map((a) => JSON.stringify(a)).join(', ')}
              ) returned:
            </AppText>
          </View>

          <AppText variant="code" style={styles.outputText}>
            {output.text}
          </AppText>

          {/* Live Console Logs Terminal */}
          {output.logs && output.logs.length > 0 && (
            <View style={styles.terminalBox}>
              <View style={styles.terminalHeader}>
                <Ionicons name="terminal-outline" size={13} color={colors.accent.primary} />
                <AppText variant="caption" style={styles.terminalTitle}>
                  Console Output ({output.logs.length})
                </AppText>
              </View>
              {output.logs.map((logMsg, lIdx) => (
                <AppText key={lIdx} variant="code" style={styles.terminalText}>
                  &gt; {logMsg}
                </AppText>
              ))}
            </View>
          )}

          {output.explanation ? (
            <View style={styles.outputExplanation}>
              <Ionicons name="bulb-outline" size={14} color={colors.accent.primary} />
              <AppText variant="caption" style={styles.outputExplanationText}>
                {output.explanation}
              </AppText>
            </View>
          ) : null}
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
  language,
  onPassed,
}: {
  challenge: Challenge;
  engineStatus: 'available' | 'unavailable' | 'initializing' | 'error';
  language?: string;
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
      tests,
      language
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
          <View style={styles.editorHeaderLeft}>
            <Ionicons
              name={getLanguageDescriptor(language).icon}
              size={13}
              color={getLanguageDescriptor(language).color}
            />
            <AppText
              variant="caption"
              style={[
                styles.editorLang,
                { color: getLanguageDescriptor(language).color },
              ]}
            >
              {getLanguageDescriptor(language).label}
            </AppText>
          </View>
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
  if (TRY_IT_BY_LESSON[lesson.id]) {
    return TRY_IT_BY_LESSON[lesson.id];
  }
  const langDesc = getLanguageDescriptor(lesson.language);
  return {
    starterCode: langDesc.defaultStarterCode('solve'),
    functionName: 'solve',
    args: [10],
    params: [
      {
        name: 'value',
        label: 'Input Value',
        defaultValue: 10,
        type: 'number',
        min: 0,
        max: 100,
        step: 5,
        options: [5, 10, 20, 50],
      },
    ],
    hint: `Experiment with ${langDesc.shortLabel} code and inputs, then click Run.`,
    conceptNote: `Write ${langDesc.shortLabel} code with valid syntax and return values.`,
    miniGoal: {
      description: 'Execute the code successfully and return a valid result',
      check: (result) => result !== undefined && result !== null,
    },
    quickSnippets: langDesc.quickSnippets,
    explanationTemplate: (args, result) =>
      `Ran solve(${JSON.stringify(args[0])}) -> Result: ${JSON.stringify(result)}`,
  };
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
      gap: spacing.sm,
    },

    headerCenter: {
      flex: 1,
      gap: 1,
      paddingHorizontal: 2,
    },

    breadcrumbText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: colors.accent.primary,
    },

    headerLessonTitle: {
      fontWeight: '700',
      color: colors.text.primary,
    },

    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },

    timeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.full,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    timeBadgeText: {
      fontSize: 10,
      fontWeight: '600',
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
      gap: spacing.xs,
      ...shadows.medium,
    },

    heroBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },

    heroLangPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
      backgroundColor: colors.accent.soft,
    },

    heroLangText: {
      color: colors.accent.primary,
      fontWeight: '700',
      fontSize: 11,
    },

    heroTitle: {
      letterSpacing: -0.4,
      lineHeight: 32,
    },

    stepHeroDesc: {
      marginTop: spacing.xs,
      lineHeight: 22,
    },

    metadata: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginTop: spacing.md,
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
      gap: 4,
      marginBottom: spacing.xs,
    },

    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexWrap: 'wrap',
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
      lineHeight: 20,
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
      lineHeight: 24,
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
      gap: spacing.xs,
    },

    editorLang: {
      color: colors.accent.secondary,
      fontWeight: '600',
    },

    conceptNoteBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.08),
      borderRadius: radius.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent.primary,
    },

    conceptNoteText: {
      flex: 1,
      color: colors.text.primary,
      lineHeight: 20,
    },

    miniGoalCard: {
      padding: spacing.md,
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.08),
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: hexWithAlpha(colors.accent.primary, 0.25),
      gap: 4,
    },

    miniGoalCardDone: {
      backgroundColor: hexWithAlpha(colors.status.success, 0.12),
      borderColor: hexWithAlpha(colors.status.success, 0.4),
    },

    miniGoalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },

    miniGoalTag: {
      fontWeight: '800',
      letterSpacing: 0.6,
      fontSize: 10,
    },

    miniGoalDesc: {
      color: colors.text.primary,
      fontWeight: '600',
      lineHeight: 18,
    },

    paramsCard: {
      padding: spacing.md,
      backgroundColor: colors.surface.primary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.default,
      gap: spacing.sm,
    },

    paramsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },

    paramsTitle: {
      fontWeight: '600',
      color: colors.text.primary,
    },

    paramsList: {
      gap: spacing.sm,
    },

    paramCard: {
      gap: spacing.xs,
      padding: spacing.sm,
      backgroundColor: colors.surface.secondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    paramMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },

    paramName: {
      fontWeight: '700',
      color: colors.accent.primary,
      fontFamily: typography.code.fontFamily,
    },

    paramLabel: {
      flexShrink: 1,
    },

    paramControlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: 2,
    },

    stepperContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border.default,
      backgroundColor: colors.surface.primary,
      overflow: 'hidden',
    },

    stepperBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },

    stepperDisplay: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      minWidth: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.08),
    },

    stepperValText: {
      fontFamily: typography.code.fontFamily,
      fontWeight: '700',
      color: colors.accent.primary,
    },

    paramOptions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },

    paramPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border.default,
      backgroundColor: colors.surface.primary,
    },

    paramPillActive: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.accent.primary,
      backgroundColor: hexWithAlpha(colors.accent.primary, 0.15),
    },

    paramPillText: {
      color: colors.text.secondary,
      fontFamily: typography.code.fontFamily,
      fontWeight: '500',
    },

    paramPillTextActive: {
      color: colors.accent.primary,
      fontFamily: typography.code.fontFamily,
      fontWeight: '700',
    },

    snippetsWrapper: {
      marginTop: 2,
    },

    snippetsScroll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: 2,
    },

    snippetLabelBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginRight: 2,
    },

    snippetLabel: {
      fontWeight: '700',
      fontSize: 11,
      color: colors.accent.primary,
    },

    snippetChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
      backgroundColor: colors.surface.secondary,
      borderWidth: 1,
      borderColor: colors.border.default,
    },

    snippetChipText: {
      fontFamily: typography.code.fontFamily,
      fontSize: 11,
      fontWeight: '600',
      color: colors.text.primary,
    },

    editorHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flex: 1,
      flexShrink: 1,
      overflow: 'hidden',
    },

    callPreview: {
      fontFamily: typography.code.fontFamily,
      fontSize: 11,
      flexShrink: 1,
    },

    tryItActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },

    tryItMainBtn: {
      flex: 1,
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

    terminalBox: {
      marginTop: spacing.xs,
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: '#030712',
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.2)',
      gap: 3,
    },

    terminalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 3,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },

    terminalTitle: {
      color: colors.accent.primary,
      fontWeight: '700',
      fontSize: 10,
      letterSpacing: 0.5,
    },

    terminalText: {
      color: '#4ADE80',
      fontSize: 12,
      lineHeight: 16,
    },

    outputExplanation: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: hexWithAlpha(colors.border.default, 0.5),
    },

    outputExplanationText: {
      flex: 1,
      color: colors.text.secondary,
      lineHeight: 16,
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
