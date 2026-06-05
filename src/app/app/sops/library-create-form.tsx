'use client';

import { useState, useTransition } from 'react';
import { FolderPlus, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createLibraryAction } from './actions';

export function LibraryCreateForm() {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <div className="flex justify-end">
        <Button
          type="button"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Add library entry"
          title="Add library entry"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-fg)]">
            Add library entry
          </h2>
          <p className="mt-1 text-[12px] text-[var(--color-fg-muted)]">
            Create a link to a playbook, SOP folder, or onboarding resource.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setOpen(false)}
          aria-label="Close create entry form"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <form id="library-create-form" action={onSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="library-name">Name</Label>
            <Input id="library-name" name="name" placeholder="Sales playbook" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="library-category">Category</Label>
            <Input
              id="library-category"
              name="category"
              placeholder="Sales"
              defaultValue="General"
              required
            />
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
    </Card>
  );
}
