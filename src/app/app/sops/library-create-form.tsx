'use client';

import { useTransition } from 'react';
import { FolderPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createLibraryAction } from './actions';

export function LibraryCreateForm() {
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createLibraryAction(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Library entry created');
      const form = document.getElementById('library-create-form') as HTMLFormElement | null;
      form?.reset();
    });
  }

  return (
    <form id="library-create-form" action={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="library-name">Name</Label>
          <Input id="library-name" name="name" placeholder="Sales playbook" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="library-url">External URL</Label>
          <Input
            id="library-url"
            name="url"
            type="url"
            placeholder="https://drive.google.com/..."
            required
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="library-description">Description</Label>
        <Textarea
          id="library-description"
          name="description"
          rows={3}
          placeholder="What this library contains and who should use it."
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] text-[var(--color-fg-dim)]">
          New entries are admin-only until you grant role access from their settings.
        </p>
        <Button type="submit" disabled={pending}>
          <FolderPlus className="h-4 w-4" />
          {pending ? 'Creating...' : 'Create entry'}
        </Button>
      </div>
    </form>
  );
}
