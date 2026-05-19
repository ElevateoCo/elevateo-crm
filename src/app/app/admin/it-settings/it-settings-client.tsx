'use client';

import { useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { KeyRound, Trash2, Mail, UserCog, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPill } from '@/components/shared/user-pill';
import { LocalTime } from '@/components/shared/local-time';
import { roleLabel } from '@/lib/formatters';
import type { Division, User } from '@/lib/supabase/types';
import {
  itCreateUser,
  itDeleteUser,
  itResetPassword,
  itUpdateEmail,
  itUpdateFullName,
} from './actions';

const ROLES = ['owner', 'executive', 'lead', 'member', 'reservist', 'external'] as const;

export function ItSettingsClient({
  users,
  divisions,
  currentUserId,
}: {
  users: User[];
  divisions: Division[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState('');
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [users, query]);

  function run(fn: () => Promise<{ error?: string } | void>, successMsg?: string) {
    startTransition(async () => {
      const r = await fn();
      if (r && 'error' in r && r.error) toast.error(r.error);
      else toast.success(successMsg ?? 'Done');
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-fg-dim)]" />
          <Input
            placeholder="Search name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <AddUserDialog divisions={divisions} users={users} />
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-white overflow-hidden">
        <div className="grid grid-cols-[1fr_220px_120px_240px] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-fg-dim)] px-4 py-2 border-b border-[var(--color-border)]">
          <div>Person</div>
          <div>Email</div>
          <div>Role</div>
          <div className="text-right">IT actions</div>
        </div>
        {filtered.map((u) => {
          const isSelf = u.id === currentUserId;
          return (
            <div
              key={u.id}
              className="grid grid-cols-[1fr_220px_120px_240px] items-center px-4 py-2.5 border-b border-[var(--color-border)] last:border-b-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <UserPill user={u} />
                <LocalTime timezone={u.timezone} />
              </div>
              <div className="text-[12px] text-[var(--color-fg-muted)] truncate">{u.email}</div>
              <div>
                <Badge tone="default">{roleLabel[u.role]}</Badge>
              </div>
              <div className="flex justify-end gap-1.5">
                <EditNameDialog user={u} onSave={(name) => run(() => itUpdateFullName(u.id, name), 'Name updated')} pending={pending} />
                <EditEmailDialog user={u} onSave={(email) => run(() => itUpdateEmail(u.id, email), 'Email updated')} pending={pending} />
                <ResetPasswordDialog user={u} onConfirm={() => run(() => itResetPassword(u.id), 'Password reset to password123')} pending={pending} />
                {isSelf ? null : (
                  <DeleteUserDialog user={u} onConfirm={() => run(() => itDeleteUser(u.id), `${u.full_name || u.email} deleted`)} pending={pending} />
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12px] text-[var(--color-fg-dim)]">
            No users match.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AddUserDialog({ divisions, users }: { divisions: Division[]; users: User[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [role, setRole] = useState<(typeof ROLES)[number]>('member');
  const [division, setDivision] = useState<string>('');
  const [manager, setManager] = useState<string>('');

  function onSubmit(formData: FormData) {
    formData.set('role', role);
    formData.set('division_code', division);
    formData.set('manager_email', manager);
    startTransition(async () => {
      const r = await itCreateUser(formData);
      if (r?.error) toast.error(r.error);
      else {
        toast.success('User created with password "password123"');
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5" /> Add user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {roleLabel[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Division</Label>
              <Select value={division} onValueChange={setDivision}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {divisions.map((d) => (
                    <SelectItem key={d.id} value={d.code}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Reports to</Label>
            <Select value={manager} onValueChange={setManager}>
              <SelectTrigger>
                <SelectValue placeholder="No manager" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.email}>
                    {u.full_name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[11px] text-[var(--color-fg-dim)]">
            Initial password: <code className="font-mono">password123</code>. User is forced to
            change it on first sign-in.
          </p>
          <div className="flex justify-end">
            <Button disabled={pending}>{pending ? 'Creating...' : 'Create user'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditNameDialog({
  user,
  onSave,
  pending,
}: {
  user: User;
  onSave: (name: string) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(user.full_name);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Change name">
          <UserCog className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change name</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new_name">Full name</Label>
            <Input id="new_name" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={pending || !value.trim() || value === user.full_name}
              onClick={() => {
                onSave(value.trim());
                setOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditEmailDialog({
  user,
  onSave,
  pending,
}: {
  user: User;
  onSave: (email: string) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(user.email);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Change email">
          <Mail className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change email</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new_email">New email</Label>
            <Input
              id="new_email"
              type="email"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-[var(--color-fg-dim)]">
            This rewires auth, identity, and profile rows. The user signs in with the new email
            next time.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={pending || !value.includes('@') || value === user.email}
              onClick={() => {
                onSave(value.trim());
                setOpen(false);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  user,
  onConfirm,
  pending,
}: {
  user: User;
  onConfirm: () => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" title="Reset password">
          <KeyRound className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password?</DialogTitle>
        </DialogHeader>
        <p className="text-[13px] text-[var(--color-fg-muted)]">
          <strong className="text-[var(--color-fg)]">{user.full_name || user.email}</strong>'s
          password will be set to <code className="font-mono">password123</code>. They'll be
          forced to choose a new one on next sign-in.
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DeleteUserDialog({
  user,
  onConfirm,
  pending,
}: {
  user: User;
  onConfirm: () => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          title="Delete user"
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this user?</DialogTitle>
        </DialogHeader>
        <p className="text-[13px] text-[var(--color-fg-muted)]">
          <strong className="text-[var(--color-fg)]">{user.full_name || user.email}</strong> will
          be permanently removed. Anything they owned (tasks, projects, clients) keeps existing
          but those FKs become NULL.
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={pending}
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
