// SOP library types — single source of truth, imported by both the Supabase
// Database typing (lib/supabase/types) and the browser UI. A library is a card
// that opens an external link (e.g. a Google Drive folder). Access is granted
// per role and editable by admins.

import type { UserRole } from '@/lib/supabase/types';

export type Library = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  url: string; // external link (e.g. Google Drive folder) opened on click
  sort_order: number;
  created_at: string;
};

/** A single grant: this role may open this library. */
export type LibraryAccess = {
  library_id: string;
  role: UserRole;
  created_at: string;
};
