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
};

export function useAddAlgorithmProblemMutation() {
  const queryClient = useQueryClient();
  const client = new DBClient<AlgorithmProblemRow>('algorithm_problems');

  return useMutation({
    mutationFn: async (payload: AddAlgorithmProblemPayload) => {
      await client.insert({
        ...payload,
        reviewed: false,
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
