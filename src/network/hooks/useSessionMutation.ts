import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DBClient } from '../supabase/client';
import { SessionCategory, SessionRow } from '../supabase/types';

export type SaveSessionPayload = {
  device_id: string;
  category: SessionCategory;
  started_at: string;
  duration_seconds: number;
  description: string | null;
};

export function useSessionMutation() {
  const queryClient = useQueryClient();
  const sessionsClient = new DBClient<SessionRow>('sessions');

  return useMutation({
    mutationFn: async (payload: SaveSessionPayload) => {
      await sessionsClient.insert(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
