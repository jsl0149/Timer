'use client';

import { useState, useEffect } from 'react';
import { getOrCreateDeviceId } from '@/network/device-id';
import type { SessionCategory, SessionRow } from '@/network/supabase/types';
import { useSessionQuery } from '@/network/hooks/useSessionQuery';
import { useSessionMutation } from '@/network/hooks/useSessionMutation';

function deriveTotals(sessions: SessionRow[]): Record<SessionCategory, number> {
  const next: Record<SessionCategory, number> = {
    cs: 0,
    algorithm: 0,
    silmu: 0,
  };
  sessions.forEach((row) => {
    if (row.category in next)
      next[row.category as SessionCategory] += row.duration_seconds;
  });
  return next;
}

export function useSessions() {
  const [deviceId, setDeviceId] = useState('');

  const { data: sessions = [], isLoading } = useSessionQuery(deviceId);
  const saveSessionMutation = useSessionMutation();

  useEffect(() => {
    setDeviceId(getOrCreateDeviceId());
  }, []);

  const totals = deriveTotals(sessions);

  const saveSession = saveSessionMutation.mutate;
  const isSaving = saveSessionMutation.isPending;

  return {
    sessions,
    totals,
    isLoading,
    saveSession,
    isSaving,
    deviceId,
  };
}
