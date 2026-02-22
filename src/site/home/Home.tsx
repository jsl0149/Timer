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
  { id: 'algorithm', label: '알고리즘' },
  { id: 'silmu', label: '실무 공부' },
];

const TARGET_HOURS = 1000;

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
    addProblem,
    toggleReviewed,
    isAdding,
    isUpdating,
    deviceId: problemDeviceId,
  } = useAlgorithmProblems();
  const reviewedProblems = algorithmProblems.filter((p) => p.reviewed);

  const [problemName, setProblemName] = useState('');
  const [problemCategory, setProblemCategory] = useState('');
  const [problemLink, setProblemLink] = useState('');
  const [solvedAt, setSolvedAt] = useState('');
  const [reviewBy, setReviewBy] = useState('');

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

  const totalSeconds = totals.cs + totals.algorithm + totals.silmu;
  const totalHours = totalSeconds / 3600;
  const progressPercent = Math.min(100, (totalHours / TARGET_HOURS) * 100);

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

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
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
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
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
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            다시 풀 문제 (알고리즘)
          </h2>

          <form
            className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !problemDeviceId ||
                !problemName.trim() ||
                !problemCategory.trim() ||
                !solvedAt ||
                !reviewBy
              )
                return;
              addProblem(
                {
                  device_id: problemDeviceId,
                  problem_name: problemName.trim(),
                  category: problemCategory.trim(),
                  link: problemLink.trim() || null,
                  solved_at: solvedAt,
                  review_by: reviewBy,
                },
                {
                  onSuccess: () => {
                    setProblemName('');
                    setProblemCategory('');
                    setProblemLink('');
                    setSolvedAt('');
                    setReviewBy('');
                  },
                },
              );
            }}
          >
            <label className="block">
              <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                문제 이름
              </span>
              <input
                type="text"
                value={problemName}
                onChange={(e) => setProblemName(e.target.value)}
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
                value={problemCategory}
                onChange={(e) => setProblemCategory(e.target.value)}
                placeholder="예: BFS, DP"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                링크
              </span>
              <input
                type="url"
                value={problemLink}
                onChange={(e) => setProblemLink(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                푼 날짜
              </span>
              <input
                type="date"
                value={solvedAt}
                onChange={(e) => setSolvedAt(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                다시 풀 날짜
              </span>
              <div className="mt-1 flex gap-2">
                <input
                  type="date"
                  value={reviewBy}
                  onChange={(e) => setReviewBy(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={
                    !problemDeviceId ||
                    !problemName.trim() ||
                    !problemCategory.trim() ||
                    !solvedAt ||
                    !reviewBy ||
                    isAdding
                  }
                  className="cursor-pointer shrink-0 rounded-lg bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? '추가 중…' : '추가'}
                </button>
              </div>
            </label>
          </form>

          <div className="mt-4">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              다시 풀어야 할 목록
            </p>
            {toReview.length === 0 && reviewedProblems.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                등록된 문제 없음
              </p>
            ) : (
              <ul className="space-y-2">
                {[...toReview, ...reviewedProblems].map((p) => {
                  const now = new Date();
                  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                  const isDue = !p.reviewed && p.review_by <= today;
                  return (
                    <li
                      key={p.id}
                      className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border px-3 py-2 text-sm ${
                        p.reviewed
                          ? 'border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/80 opacity-90'
                          : isDue
                            ? 'border-amber-400 dark:border-amber-500 bg-amber-50/80 dark:bg-amber-950/30'
                            : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'
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
                        className={`tabular-nums shrink-0 ${isDue ? 'font-medium text-amber-700 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'}`}
                      >
                        복습: {p.review_by}
                        {isDue && <span className="ml-1 text-xs">(도래)</span>}
                      </span>
                      <span className="ml-auto shrink-0">
                        {p.reviewed ? (
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            다시 품
                          </span>
                        ) : (
                          <label
                            className={`flex items-center gap-1.5 ${isDue ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                          >
                            <input
                              type="checkbox"
                              checked={false}
                              onChange={() => toggleReviewed(p.id)}
                              disabled={isUpdating || !isDue}
                              className="cursor-pointer rounded border-zinc-400 disabled:cursor-not-allowed"
                            />
                            <span className="text-xs text-zinc-600 dark:text-zinc-300">
                              다시 풀었음
                            </span>
                          </label>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
