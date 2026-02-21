import { useQuery } from '@tanstack/react-query';
import { DBClient } from '../supabase/client';
import { SessionRow } from '../supabase/types';

export function useSessionQuery(deviceId: string) {
  const sessionsClient = new DBClient<SessionRow>('sessions');

  return useQuery({
    queryKey: ['sessions', deviceId],
    queryFn: () =>
      sessionsClient.getAll({
        column: 'device_id',
        value: deviceId,
        orderBy: { column: 'started_at', ascending: false },
      }),
  });
}
