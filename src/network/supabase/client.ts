import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export class DBClient<
  TRow extends object,
  TInsert = Omit<TRow, 'id' | 'created_at'> & {
    id?: string;
    created_at?: string;
  },
> {
  private client: SupabaseClient;

  constructor(
    private tableName: string,
    client?: SupabaseClient,
  ) {
    this.client = client ?? createClient();
  }

  async getAll(options?: {
    column?: keyof TRow;
    value?: TRow[keyof TRow];
    orderBy?: { column: keyof TRow; ascending?: boolean };
  }): Promise<TRow[]> {
    let query = this.client.from(this.tableName).select('*');
    if (options?.column != null && options?.value !== undefined) {
      query = query.eq(options.column as string, options.value);
    }
    if (options?.orderBy) {
      query = query.order(options.orderBy.column as string, {
        ascending: options.orderBy.ascending ?? true,
      });
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as TRow[];
  }

  async getOne(id: string): Promise<TRow | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data as TRow | null;
  }

  async insert(payload: TInsert): Promise<TRow> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(payload as Record<string, unknown>)
      .select()
      .single();
    if (error) throw error;
    return data as TRow;
  }

  async update(id: string, payload: Partial<TRow>): Promise<TRow> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update(payload as Record<string, unknown>)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TRow;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}
