import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DBClient } from '../supabase/client';
import { AlgorithmProblemRow } from '../supabase/types';

export type AddAlgorithmProblemPayload = {
  device_id: string;
  problem_name: string;
  category: string;
  link: string | null;
  solved_at: string;
  review_by: string;
  first_solve_seconds?: number | null;
  second_solve_seconds?: number | null;
  reviewed?: boolean;
};

export function useAddAlgorithmProblemMutation() {
  const queryClient = useQueryClient();
  const client = new DBClient<AlgorithmProblemRow>('algorithm_problems');

  return useMutation({
    mutationFn: async (payload: AddAlgorithmProblemPayload) => {
      await client.insert({
        reviewed: false,
        ...payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['algorithm_problems'] });
    },
  });
}

export function useUpdateAlgorithmProblemMutation() {
  const queryClient = useQueryClient();
  const client = new DBClient<AlgorithmProblemRow>('algorithm_problems');

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<AlgorithmProblemRow>;
    }) => {
      await client.update(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['algorithm_problems'] });
    },
  });
}
