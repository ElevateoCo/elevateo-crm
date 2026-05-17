import { TableQuery } from './query';
import {
  readSessionUser,
  signInWithPassword,
  signOutCurrent,
  signUpUser,
} from './auth';

interface SbAuthGetUserResult {
  data: { user: { id: string; email: string } | null };
  error: { message: string } | null;
}

export interface SupabaseLikeClient {
  auth: {
    getUser(): Promise<SbAuthGetUserResult>;
    signInWithPassword(args: { email: string; password: string }): Promise<{
      error: { message: string } | null;
    }>;
    signUp(args: {
      email: string;
      password: string;
      options?: { data?: { full_name?: string } };
    }): Promise<{ error: { message: string } | null }>;
    signOut(): Promise<{ error: null }>;
  };
  from(table: string): TableQuery;
}

export function createLocalClient(): SupabaseLikeClient {
  return {
    auth: {
      async getUser() {
        const u = await readSessionUser();
        return {
          data: { user: u ? { id: u.id, email: u.email } : null },
          error: null,
        };
      },
      async signInWithPassword({ email, password }) {
        const r = await signInWithPassword(email, password);
        return { error: r.error };
      },
      async signUp({ email, password, options }) {
        const r = await signUpUser(email, password, options?.data);
        return { error: r.error };
      },
      async signOut() {
        await signOutCurrent();
        return { error: null };
      },
    },
    from(table: string) {
      // The TableQuery constructor validates the table name at runtime.
      return new TableQuery(table as never);
    },
  };
}
