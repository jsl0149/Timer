import { useQuery } from '@tanstack/react-query';
import { DBClient } from '../supabase/client';
import { AlgorithmProblemRow } from '../supabase/types';

export function useAlgorithmProblemQuery(deviceId: string) {
  const client = new DBClient<AlgorithmProblemRow>('algorithm_problems');

  return useQuery({
    queryKey: ['algorithm_problems', deviceId],
    queryFn: () =>
      client.getAll({
        column: 'device_id',
        value: deviceId,
        orderBy: { column: 'review_by', ascending: true },
      }),
    enabled: !!deviceId,
  });
}
