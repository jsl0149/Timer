export type SessionCategory = 'cs' | 'algorithm' | 'silmu';

export interface SessionRow {
  id: string;
  device_id: string;
  category: SessionCategory;
  started_at: string;
  duration_seconds: number;
  description: string | null;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: SessionRow;
        Insert: Omit<SessionRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
          description?: string | null;
        };
        Update: Partial<Omit<SessionRow, 'id'>>;
      };
    };
  };
}
