'use client';

import { useState, useEffect } from 'react';
import { getOrCreateDeviceId } from '@/network/device-id';
import type { AlgorithmProblemRow } from '@/network/supabase/types';
import { useAlgorithmProblemQuery } from '@/network/hooks/useAlgorithmProblemQuery';
import {
  useAddAlgorithmProblemMutation,
  useUpdateAlgorithmProblemMutation,
  type AddAlgorithmProblemPayload,
} from '@/network/hooks/useAlgorithmProblemMutation';

export function useAlgorithmProblems() {
  const [deviceId, setDeviceId] = useState('');

  const { data: problems = [], isLoading } = useAlgorithmProblemQuery(deviceId);
  const addMutation = useAddAlgorithmProblemMutation();
  const updateMutation = useUpdateAlgorithmProblemMutation();

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  const sortedProblems = [...problems].sort(
    (a: AlgorithmProblemRow, b: AlgorithmProblemRow) =>
      new Date(b.solved_at).getTime() - new Date(a.solved_at).getTime(),
  );

  const toReview = sortedProblems.filter((p: AlgorithmProblemRow) => !p.reviewed);

  const oneShot = sortedProblems
    .filter(
      (p: AlgorithmProblemRow) =>
        p.reviewed &&
        (p.second_solve_seconds == null || p.second_solve_seconds === 0),
    )
    .slice(0, 5);

  const reSolved = sortedProblems
    .filter(
      (p: AlgorithmProblemRow) =>
        p.reviewed &&
        p.second_solve_seconds != null &&
        p.second_solve_seconds > 0,
    )
    .slice(0, 5);

  const addProblem = addMutation.mutate;
  const updateProblem = updateMutation.mutate;
  const toggleReviewed = (id: string) => {
    updateMutation.mutate({ id, payload: { reviewed: true } });
  };

  return {
    problems: sortedProblems,
    toReview,
    oneShot,
    reSolved,
    addProblem,
    updateProblem,
    toggleReviewed,
    isLoading,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    deviceId,
  };
}

export type { AddAlgorithmProblemPayload };
