'use client';

import { useState, useEffect } from 'react';
import type { SessionCategory, SessionRow } from '@/network/supabase/types';
import { useSessions } from '@/hooks/useSessions';
import { useAlgorithmProblems } from '@/hooks/useAlgorithmProblems';
import { formatAccumulated } from '@/util/formatAccumulated';
import { formatElapsed } from '@/util/formatElapsed';
import { formatStartedAtKST } from '@/util/formatStartedAtKST';

const CATEGORIES: { id: SessionCategory; label: string }[] = [
  { id: 'cs', label: 'CS 공부' },
  { id: 'silmu', label: '실무 공부' },
];

const TARGET_HOURS = 1000;
const FORTY_MINUTES_SECONDS = 40 * 60;

export default function Home() {
  const {
    sessions,
    totals,
    isLoading: loading,
    saveSession,
    isSaving: saving,
    deviceId,
  } = useSessions();

  const {
    problems: algorithmProblems,
    toReview,
    oneShot,
    reSolved,
    addProblem,
    updateProblem,
    isAdding,
    isUpdating,
    deviceId: problemDeviceId,
  } = useAlgorithmProblems();

  const [algoProblemName, setAlgoProblemName] = useState('');
  const [algoProblemCategory, setAlgoProblemCategory] = useState('');
  const [algoProblemLink, setAlgoProblemLink] = useState('');
  const [algoStartedAt, setAlgoStartedAt] = useState<number | null>(null);
  const [algoElapsedSeconds, setAlgoElapsedSeconds] = useState(0);
  const [algoIsPaused, setAlgoIsPaused] = useState(false);

  const [currentProblemId, setCurrentProblemId] = useState<string | null>(null);
  const [reviewStartedAt, setReviewStartedAt] = useState<number | null>(null);
  const [reviewElapsedSeconds, setReviewElapsedSeconds] = useState(0);
  const [reviewIsPaused, setReviewIsPaused] = useState(false);

  const [selectedCategory, setSelectedCategory] =
    useState<SessionCategory | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionDescription, setSessionDescription] = useState('');

  useEffect(() => {
    if (!startedAt || isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, isPaused]);

  useEffect(() => {
    if (!algoStartedAt || algoIsPaused) return;
    const interval = setInterval(() => {
      setAlgoElapsedSeconds(Math.floor((Date.now() - algoStartedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [algoStartedAt, algoIsPaused]);

  const isRunning = selectedCategory !== null && startedAt !== null;

  const handleStart = (category: SessionCategory) => {
    setSelectedCategory(category);
    setStartedAt(Date.now());
    setElapsedSeconds(0);
    setIsPaused(false);
    setSessionDescription('');
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setStartedAt(Date.now() - elapsedSeconds * 1000);
    setIsPaused(false);
  };

  useEffect(() => {
    if (!reviewStartedAt || reviewIsPaused) return;
    const interval = setInterval(() => {
      setReviewElapsedSeconds(
        Math.floor((Date.now() - reviewStartedAt) / 1000),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [reviewStartedAt, reviewIsPaused]);

  const algoIsRunning = algoStartedAt !== null;
  const reviewIsRunning = reviewStartedAt !== null;

  const resetNewSolveState = () => {
    setAlgoStartedAt(null);
    setAlgoElapsedSeconds(0);
    setAlgoIsPaused(false);
    setAlgoProblemName('');
    setAlgoProblemCategory('');
    setAlgoProblemLink('');
  };

  const resetReviewState = () => {
    setReviewStartedAt(null);
    setReviewElapsedSeconds(0);
    setReviewIsPaused(false);
    setCurrentProblemId(null);
  };

  const handleAlgorithmStart = () => {
    if (!algoProblemName.trim() || !algoProblemCategory.trim()) return;
    if (reviewIsRunning) return;
    setAlgoStartedAt(Date.now());
    setAlgoElapsedSeconds(0);
    setAlgoIsPaused(false);
  };

  const handleAlgorithmPause = () => {
    if (!algoIsRunning) return;
    setAlgoIsPaused(true);
  };

  const handleAlgorithmResume = () => {
    if (!algoIsRunning || !algoIsPaused || algoStartedAt === null) return;
    setAlgoStartedAt(Date.now() - algoElapsedSeconds * 1000);
    setAlgoIsPaused(false);
  };

  const handleAlgorithmStop = () => {
    if (!problemDeviceId || algoStartedAt === null) return;

    const elapsed = algoElapsedSeconds;
    if (elapsed <= 0) {
      resetNewSolveState();
      return;
    }

    const now = new Date();
    const solvedDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });

    if (!algoProblemName.trim() || !algoProblemCategory.trim()) return;

    if (elapsed <= FORTY_MINUTES_SECONDS) {
      // 40분 안에 해결 → 한 번에 푼 문제
      addProblem(
        {
          device_id: problemDeviceId,
          problem_name: algoProblemName.trim(),
          category: algoProblemCategory.trim(),
          link: algoProblemLink.trim() || null,
          solved_at: solvedDate,
          review_by: solvedDate,
          first_solve_seconds: elapsed,
          second_solve_seconds: null,
          reviewed: true,
        },
        {
          onSuccess: () => {
            resetNewSolveState();
          },
        },
      );
    } else {
      // 40분 안에 해결 못함 → 3일 뒤 다시 풀 문제
      const reviewDateObj = new Date(solvedDate);
      reviewDateObj.setUTCDate(reviewDateObj.getUTCDate() + 3);
      const reviewBy = reviewDateObj.toISOString().slice(0, 10);

      addProblem(
        {
          device_id: problemDeviceId,
          problem_name: algoProblemName.trim(),
          category: algoProblemCategory.trim(),
          link: algoProblemLink.trim() || null,
          solved_at: solvedDate,
          review_by: reviewBy,
          first_solve_seconds: elapsed,
          second_solve_seconds: null,
          reviewed: false,
        },
        {
          onSuccess: () => {
            resetNewSolveState();
          },
        },
      );
    }
  };

  const handleReviewStart = (problemId: string) => {
    if (!problemDeviceId) return;
    if (reviewIsRunning || algoIsRunning) return;
    setCurrentProblemId(problemId);
    setReviewStartedAt(Date.now());
    setReviewElapsedSeconds(0);
    setReviewIsPaused(false);
  };

  const handleReviewPause = () => {
    if (!reviewIsRunning) return;
    setReviewIsPaused(true);
  };

  const handleReviewResume = () => {
    if (!reviewIsRunning || !reviewIsPaused || reviewStartedAt === null) return;
    setReviewStartedAt(Date.now() - reviewElapsedSeconds * 1000);
    setReviewIsPaused(false);
  };

  const handleReviewStop = () => {
    if (!problemDeviceId || !currentProblemId || reviewStartedAt === null)
      return;

    const elapsed = reviewElapsedSeconds;
    if (elapsed <= 0) {
      resetReviewState();
      return;
    }

    updateProblem(
      {
        id: currentProblemId,
        payload: {
          second_solve_seconds: elapsed,
          reviewed: true,
        },
      },
      {
        onSuccess: () => {
          resetReviewState();
        },
      },
    );
  };

  const handleStop = async () => {
    if (!selectedCategory || startedAt === null || !deviceId) return;
    saveSession({
      device_id: deviceId,
      category: selectedCategory,
      started_at: new Date(startedAt).toISOString(),
      duration_seconds: elapsedSeconds,
      description: sessionDescription.trim() || null,
    });
    setSelectedCategory(null);
    setStartedAt(null);
    setElapsedSeconds(0);
    setIsPaused(false);
    setSessionDescription('');
  };

  const algorithmSecondsFromProblems = algorithmProblems.reduce(
    (sum, p) =>
      sum + (p.first_solve_seconds ?? 0) + (p.second_solve_seconds ?? 0),
    0,
  );
  const totalSeconds =
    totals.cs + totals.silmu + algorithmSecondsFromProblems;
  const totalHours = totalSeconds / 3600;
  const progressPercent = Math.min(100, (totalHours / TARGET_HOURS) * 100);

  const todayKST = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Seoul',
  });
  const todaySessionsSeconds = sessions
    .filter(
      (s) =>
        new Date(s.started_at).toLocaleDateString('en-CA', {
          timeZone: 'Asia/Seoul',
        }) === todayKST,
    )
    .reduce((sum, s) => sum + s.duration_seconds, 0);
  const todayAlgorithmSeconds = algorithmProblems
    .filter((p) => (p.solved_at ?? '').startsWith(todayKST))
    .reduce(
      (sum, p) =>
        sum + (p.first_solve_seconds ?? 0) + (p.second_solve_seconds ?? 0),
      0,
    );
  const todayTotalSeconds = todaySessionsSeconds + todayAlgorithmSeconds;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400">
        로딩 중…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-6 font-sans">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">1000시간 달성</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400 text-sm">
            2026년 2월 21일 시작
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              전체 누적
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {formatAccumulated(totalSeconds)}
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-zinc-800 dark:bg-zinc-200 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              목표 1000시간 중 {totalHours.toFixed(1)}시간 (
              {progressPercent.toFixed(1)}%)
            </p>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              오늘의 누적시간
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {formatAccumulated(todayTotalSeconds)}
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {CATEGORIES.map(({ id, label }) => {
            const isActive = selectedCategory === id;
            const canStart = !isRunning;
            const canStop = isRunning && isActive;
            const canPause = isRunning && isActive && !isPaused;
            const canResume = isRunning && isActive && isPaused;
            return (
              <div
                key={id}
                className={`rounded-2xl border p-5 transition-colors ${
                  isActive
                    ? 'border-zinc-400 dark:border-zinc-500 bg-zinc-100 dark:bg-zinc-800'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                }`}
              >
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  {label}
                </p>
                <p className="mt-2 text-xl font-semibold tabular-nums">
                  {isActive && startedAt !== null
                    ? formatElapsed(elapsedSeconds)
                    : formatAccumulated(totals[id])}
                </p>
                {isActive && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      이번에 한 일 (선택)
                    </label>
                    <input
                      type="text"
                      value={sessionDescription}
                      onChange={(e) => setSessionDescription(e.target.value)}
                      placeholder="예: OS 스케줄링, DFS, React 쿼리"
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400"
                    />
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleStart(id)}
                    disabled={!canStart || saving}
                    className="cursor-pointer rounded-lg bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    시작
                  </button>
                  {canPause && (
                    <button
                      type="button"
                      onClick={handlePause}
                      disabled={saving}
                      className="cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      일시 정지
                    </button>
                  )}
                  {canResume && (
                    <button
                      type="button"
                      onClick={handleResume}
                      disabled={saving}
                      className="cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      재개
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStop}
                    disabled={!canStop || saving}
                    className="cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? '저장 중…' : '정지'}
                  </button>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                    최근 한 일
                  </p>
                  <ul className="space-y-1.5 max-h-32 overflow-y-auto">
                    {sessions
                      .filter((s: SessionRow) => s.category === id)
                      .slice(0, 5)
                      .map((s: SessionRow) => (
                        <li
                          key={s.id}
                          className="text-xs text-zinc-600 dark:text-zinc-300 flex justify-between items-center gap-2"
                        >
                          <span className="truncate min-w-[100px]">
                            {s.description || '—'}
                          </span>
                          <span className="tabular-nums shrink-0">
                            {formatAccumulated(s.duration_seconds)}
                          </span>
                          <span className="tabular-nums shrink-0 text-zinc-500 dark:text-zinc-400">
                            {formatStartedAtKST(s.started_at)}
                          </span>
                        </li>
                      ))}
                    {sessions.filter((s: SessionRow) => s.category === id)
                      .length === 0 && (
                      <li className="text-xs text-zinc-400 dark:text-zinc-500">
                        기록 없음
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              알고리즘
            </h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              누적{' '}
              <span className="tabular-nums text-zinc-800 dark:text-zinc-200">
                {formatAccumulated(
                  algorithmProblems.reduce((sum, p) => {
                    const first = p.first_solve_seconds ?? 0;
                    const second = p.second_solve_seconds ?? 0;
                    return sum + first + second;
                  }, 0),
                )}
              </span>
            </p>
          </div>

          {/* 풀이 타이머: 문제/카테고리/링크 입력 후 시작 → 종료 시 세션 저장 */}
          <div className="mt-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 p-4">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">
              풀이 타이머 (문제·카테고리·링크 입력 후 시작 → 종료 시 시간 저장)
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
              <label className="block">
                <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  문제 이름
                </span>
                <input
                  type="text"
                  value={algoProblemName}
                  onChange={(e) => setAlgoProblemName(e.target.value)}
                  placeholder="예: 토마토"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  카테고리
                </span>
                <input
                  type="text"
                  value={algoProblemCategory}
                  onChange={(e) => setAlgoProblemCategory(e.target.value)}
                  placeholder="예: BFS, DP"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                />
              </label>
              <label className="block lg:col-span-2">
                <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  링크 (선택)
                </span>
                <input
                  type="url"
                  value={algoProblemLink}
                  onChange={(e) => setAlgoProblemLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                {algoIsRunning && algoStartedAt !== null
                  ? formatElapsed(algoElapsedSeconds)
                  : '00:00:00'}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAlgorithmStart}
                  disabled={
                    algoIsRunning ||
                    !algoProblemName.trim() ||
                    !algoProblemCategory.trim() ||
                    saving
                  }
                  className="cursor-pointer rounded-lg bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  풀이 시작
                </button>
                {algoIsRunning && !algoIsPaused && (
                  <button
                    type="button"
                    onClick={handleAlgorithmPause}
                    disabled={saving}
                    className="cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    일시 정지
                  </button>
                )}
                {algoIsRunning && algoIsPaused && (
                  <button
                    type="button"
                    onClick={handleAlgorithmResume}
                    disabled={saving}
                    className="cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    재개
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAlgorithmStop}
                  disabled={!algoIsRunning || saving}
                  className="cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? '저장 중…' : '풀이 종료 및 저장'}
                </button>
              </div>
            </div>
          </div>

          {/* 다시 풀 문제 / 푼 문제 목록 */}
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                다시 풀 문제
              </p>
              {toReview.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">없음</p>
              ) : (
                <ul className="space-y-2">
                  {toReview.map((p) => {
                    const now = new Date();
                    const today = `${now.getFullYear()}-${String(
                      now.getMonth() + 1,
                    ).padStart(2, '0')}-${String(now.getDate()).padStart(
                      2,
                      '0',
                    )}`;
                    const isDue = p.review_by <= today;
                    const isActive =
                      currentProblemId === p.id && reviewIsRunning;
                    return (
                      <li
                        key={p.id}
                        className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                          isDue
                            ? 'border-amber-400 dark:border-amber-500 bg-amber-50/80 dark:bg-amber-950/30'
                            : 'opacity-60 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'
                        }`}
                      >
                        <span className="font-medium min-w-0 truncate">
                          {p.link ? (
                            <a
                              href={p.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-zinc-800 dark:text-zinc-200 hover:underline"
                            >
                              {p.problem_name}
                            </a>
                          ) : (
                            p.problem_name
                          )}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 shrink-0">
                          {p.category}
                        </span>
                        <span className="tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">
                          푼 날: {p.solved_at}
                        </span>
                        <span
                          className={`tabular-nums shrink-0 ${
                            isDue
                              ? 'font-medium text-amber-700 dark:text-amber-400'
                              : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          복습: {p.review_by}
                          {isDue && (
                            <span className="ml-1 text-xs">(도래)</span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleReviewStart(p.id)}
                          disabled={
                            isUpdating ||
                            !isDue ||
                            reviewIsRunning ||
                            algoIsRunning
                          }
                          className="ml-auto shrink-0 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          다시 풀기
                        </button>
                        {isActive && (
                          <div className="mt-2 w-full flex items-center justify-between gap-2">
                            <span className="text-sm font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
                              {formatElapsed(reviewElapsedSeconds)}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {!reviewIsPaused ? (
                                <button
                                  type="button"
                                  onClick={handleReviewPause}
                                  disabled={isUpdating}
                                  className="cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  일시 정지
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleReviewResume}
                                  disabled={isUpdating}
                                  className="cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-600 px-2.5 py-1 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  재개
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleReviewStop}
                                disabled={isUpdating}
                                className="cursor-pointer rounded-lg bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 px-2.5 py-1 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                저장
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                한 번에 푼 문제
              </p>
              {oneShot.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">없음</p>
              ) : (
                <ul className="space-y-2">
                  {oneShot.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/80 px-3 py-2 text-sm"
                    >
                      <span className="font-medium min-w-0 truncate">
                        {p.link ? (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-800 dark:text-zinc-200 hover:underline"
                          >
                            {p.problem_name}
                          </a>
                        ) : (
                          p.problem_name
                        )}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400 shrink-0">
                        {p.category}
                      </span>
                      <span className="tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">
                        푼 날: {p.solved_at}
                      </span>
                      <span className="tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">
                        첫 풀이 시간:{' '}
                        {p.first_solve_seconds != null
                          ? formatElapsed(p.first_solve_seconds)
                          : '-'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                다시 풀어서 푼 문제
              </p>
              {reSolved.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">없음</p>
              ) : (
                <ul className="space-y-2">
                  {reSolved.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/80 px-3 py-2 text-sm"
                    >
                      <span className="font-medium min-w-0 truncate">
                        {p.link ? (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-800 dark:text-zinc-200 hover:underline"
                          >
                            {p.problem_name}
                          </a>
                        ) : (
                          p.problem_name
                        )}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400 shrink-0">
                        {p.category}
                      </span>
                      <span className="tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">
                        푼 날: {p.solved_at}
                      </span>
                      <span className="tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">
                        첫 풀이:{' '}
                        {p.first_solve_seconds != null
                          ? formatElapsed(p.first_solve_seconds)
                          : '-'}
                      </span>
                      <span className="tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0">
                        두 번째 풀이:{' '}
                        {p.second_solve_seconds != null
                          ? formatElapsed(p.second_solve_seconds)
                          : '-'}
                      </span>

                      <span className="ml-auto shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        다시 품
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
