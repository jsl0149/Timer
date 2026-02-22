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

  const toReview = problems.filter((p: AlgorithmProblemRow) => !p.reviewed);

  const addProblem = addMutation.mutate;
  const toggleReviewed = (id: string) => {
    updateMutation.mutate({ id, payload: { reviewed: true } });
  };

  return {
    problems,
    toReview,
    addProblem,
    toggleReviewed,
    isLoading,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    deviceId,
  };
}

export type { AddAlgorithmProblemPayload };
