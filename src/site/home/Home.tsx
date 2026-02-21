'use client';

import { useState, useEffect } from 'react';
import type { SessionCategory, SessionRow } from '@/network/supabase/types';
import { useSessions } from '@/hooks/useSessions';
import { formatAccumulated } from '@/util/formatAccumulated';
import { formatElapsed } from '@/util/formatElapsed';

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

  const [selectedCategory, setSelectedCategory] =
    useState<SessionCategory | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionDescription, setSessionDescription] = useState('');

  useEffect(() => {
    if (!startedAt) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const isRunning = selectedCategory !== null && startedAt !== null;

  const handleStart = (category: SessionCategory) => {
    setSelectedCategory(category);
    setStartedAt(Date.now());
    setElapsedSeconds(0);
    setSessionDescription('');
  };

  const handleStop = async () => {
    if (!selectedCategory || startedAt === null || !deviceId) return;
    const durationSeconds = Math.floor((Date.now() - startedAt) / 1000);
    saveSession({
      device_id: deviceId,
      category: selectedCategory,
      started_at: new Date(startedAt).toISOString(),
      duration_seconds: durationSeconds,
      description: sessionDescription.trim() || null,
    });
    setSelectedCategory(null);
    setStartedAt(null);
    setElapsedSeconds(0);
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
      <div className="mx-auto max-w-2xl space-y-8">
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
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleStart(id)}
                    disabled={!canStart || saving}
                    className="rounded-lg bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    시작
                  </button>
                  <button
                    type="button"
                    onClick={handleStop}
                    disabled={!canStop || saving}
                    className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                      .slice(0, 8)
                      .map((s: SessionRow) => (
                        <li
                          key={s.id}
                          className="text-xs text-zinc-600 dark:text-zinc-300 flex justify-between gap-2"
                        >
                          <span className="truncate">
                            {s.description || '—'}
                          </span>
                          <span className="tabular-nums shrink-0">
                            {formatAccumulated(s.duration_seconds)}
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
      </div>
    </div>
  );
}
