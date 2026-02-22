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

export interface AlgorithmProblemRow {
  id: string;
  device_id: string;
  problem_name: string;
  category: string;
  link: string | null;
  solved_at: string;
  review_by: string;
  reviewed: boolean;
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
      algorithm_problems: {
        Row: AlgorithmProblemRow;
        Insert: Omit<AlgorithmProblemRow, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<AlgorithmProblemRow, 'id'>>;
      };
    };
  };
}
