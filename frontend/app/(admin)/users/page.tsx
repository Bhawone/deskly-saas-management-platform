'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserPlus, Trash2, Users, Building2, Mail, Shield } from 'lucide-react';
import { AxiosError } from 'axios';

// ── Types ─────────────────────────────────────────────────────────────
interface UserRow {
  id: number;
  name: string;
  email: string;
  role: 'SuperAdmin' | 'CompanyAdmin' | 'Employee';
  company: { id: number; name: string } | null;
  created_at: string;
}

interface PaginatedUsers {
  data: UserRow[];
  total: number;
}

// ── Validation Schema ─────────────────────────────────────────────────
const inviteSchema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email address'),
  role:     z.enum(['Employee', 'CompanyAdmin']),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one symbol'),
});
type InviteForm = z.infer<typeof inviteSchema>;

// ── Role badge styles ─────────────────────────────────────────────────
const roleBadge: Record<string, string> = {
  SuperAdmin:   'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  CompanyAdmin: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Employee:     'bg-amber-500/20  text-amber-300  border-amber-500/30',
};

// ── Invite Slide-over ─────────────────────────────────────────────────
function InviteSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'Employee' },
  });

  const roleValue = watch('role');

  const mutation = useMutation({
    mutationFn: (data: InviteForm) => api.post('/users/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('User invited successfully!');
      reset();
      setServerErrors({});
      onClose();
    },
    onError: (err: AxiosError<{ errors?: Record<string, string[]>; message?: string }>) => {
      if (err.response?.data?.errors) {
        const errs: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.response.data.errors)) {
          errs[k] = Array.isArray(v) ? v[0] : String(v);
        }
        setServerErrors(errs);
      } else {
        toast.error(err.response?.data?.message || 'Failed to invite user.');
      }
    },
  });

  const handleClose = () => {
    reset();
    setServerErrors({});
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent className="bg-card border text-foreground w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-foreground flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-400" /> Invite Team Member
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Add a new employee or admin to your company workspace.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5 px-4 pb-6" id="invite-user-form">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-name" className="text-muted-foreground">Full Name</Label>
            <Input
              id="invite-name"
              placeholder="Jane Smith"
              {...register('name')}
              className={`bg-muted border text-foreground placeholder:text-muted-foreground focus:border-emerald-500
                ${(errors.name || serverErrors.name) ? 'border-red-500' : ''}`}
            />
            {(errors.name || serverErrors.name) && (
              <p className="text-xs text-red-400">{errors.name?.message || serverErrors.name}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-muted-foreground">Work Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                placeholder="jane@company.com"
                {...register('email')}
                className={`pl-9 bg-muted border text-foreground placeholder:text-muted-foreground focus:border-emerald-500
                  ${(errors.email || serverErrors.email) ? 'border-red-500' : ''}`}
              />
            </div>
            {(errors.email || serverErrors.email) && (
              <p className="text-xs text-red-400">{errors.email?.message || serverErrors.email}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="invite-role" className="text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> Role
            </Label>
            <Select
              value={roleValue}
              onValueChange={(v) => setValue('role', v as 'Employee' | 'CompanyAdmin')}
            >
              <SelectTrigger
                id="invite-role"
                className={`bg-muted border text-foreground focus:border-emerald-500
                  ${errors.role ? 'border-red-500' : ''}`}
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="bg-card border text-foreground">
                <SelectItem value="Employee">
                  <div>
                    <div className="font-medium">Employee</div>
                    <div className="text-xs text-muted-foreground">Can create and view tickets</div>
                  </div>
                </SelectItem>
                <SelectItem value="CompanyAdmin">
                  <div>
                    <div className="font-medium">Company Admin</div>
                    <div className="text-xs text-muted-foreground">Full access — invite users, delete tickets</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}

            {/* Role description callout */}
            <div className="rounded-lg border border bg-card p-3 text-xs text-muted-foreground leading-relaxed">
              {roleValue === 'CompanyAdmin' ? (
                <>
                  <strong className="text-emerald-300">Company Admin</strong> can manage users, update ticket statuses, delete tickets, and access all company data.
                </>
              ) : (
                <>
                  <strong className="text-amber-300">Employee</strong> can create new tickets and view existing ones. Cannot manage users or delete tickets.
                </>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Temporary Password</Label>
              <button
                type="button"
                onClick={() => {
                  const uppers = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                  const lowers = 'abcdefghijklmnopqrstuvwxyz';
                  const nums = '0123456789';
                  const syms = '!@#$%^&*_-+=';
                  const all = uppers + lowers + nums + syms;
                  let p = uppers[Math.floor(Math.random() * uppers.length)] +
                          lowers[Math.floor(Math.random() * lowers.length)] +
                          nums[Math.floor(Math.random() * nums.length)] +
                          syms[Math.floor(Math.random() * syms.length)];
                  for(let i=0; i<8; i++) p += all[Math.floor(Math.random() * all.length)];
                  p = p.split('').sort(() => 0.5 - Math.random()).join('');
                  setValue('password', p, { shouldValidate: true });
                  setShowPassword(true);
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Auto-generate
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register('password')}
                className={`bg-muted border focus:border-emerald-500 pr-10 text-foreground ${errors.password ? 'border-red-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {(errors.password || serverErrors.password) && (
              <p className="text-xs text-red-400">{errors.password?.message || serverErrors.password}</p>
            )}
            <p className="text-xs text-muted-foreground">The user should change this after their first login.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="flex-1 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-foreground"
              id="invite-submit"
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-foreground animate-spin" />
                  Inviting…
                </span>
              ) : (
                'Send Invite'
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);

  const { data, isLoading } = useQuery<PaginatedUsers>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('User removed.');
      setDeleteTarget(null);
    },
    onError: (err: AxiosError<{ message?: string }>) => {
      toast.error(err.response?.data?.message || 'Failed to remove user.');
      setDeleteTarget(null);
    },
  });

  const isAdmin = currentUser?.role === 'CompanyAdmin' || currentUser?.role === 'SuperAdmin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.total ?? '…'} member{data?.total !== 1 ? 's' : ''} in{' '}
            {currentUser?.company?.name || 'your organization'}
          </p>
        </div>
        {currentUser?.role === 'CompanyAdmin' && (
          <Button
            onClick={() => setSheetOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-foreground shadow-lg shadow-emerald-500/25"
            id="invite-user-btn"
          >
            <UserPlus className="h-4 w-4 mr-1.5" /> Invite Member
          </Button>
        )}
      </div>

      {/* Stats summary */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-3 animate-fade-in-up delay-100">
          {(['CompanyAdmin', 'Employee'] as const).map((role) => {
            const count = data.data.filter((u) => u.role === role).length;
            return (
              <Card key={role} className="border bg-card">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${role === 'CompanyAdmin' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                    {role === 'CompanyAdmin' ? (
                      <Shield className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Users className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{role === 'CompanyAdmin' ? 'Admins' : 'Employees'}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <Card className="border bg-card">
            <CardContent className="pt-5 pb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{data.total}</p>
                <p className="text-xs text-muted-foreground">Total Members</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* User list */}
      <div className="animate-fade-in-up delay-200 space-y-2">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl shimmer" />
          ))
        ) : data?.data.length === 0 ? (
          <Card className="border bg-card">
            <CardContent className="py-16 text-center">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No team members yet.</p>
              {currentUser?.role === 'CompanyAdmin' && (
                <Button
                  onClick={() => setSheetOpen(true)}
                  className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-foreground"
                >
                  <UserPlus className="h-4 w-4 mr-1.5" /> Invite your first member
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          data?.data.map((u) => {
            const initials = u.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            const isSelf   = u.id === currentUser?.id;
            return (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-xl border border bg-card px-5 py-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Avatar className="h-10 w-10 border border flex-shrink-0">
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-300 text-sm font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm truncate">{u.name}</p>
                      {isSelf && <span className="text-[10px] text-muted-foreground">(you)</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    {currentUser?.role === 'SuperAdmin' && u.company && (
                      <p className="text-[10px] text-emerald-400/80 truncate mt-0.5 flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {u.company.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <Badge className={`text-xs border ${roleBadge[u.role]}`}>{u.role}</Badge>
                  {isAdmin && !isSelf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => setDeleteTarget(u)}
                      id={`delete-user-${u.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Invite slide-over */}
      <InviteSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remove team member?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove <strong className="text-foreground">{deleteTarget?.name}</strong> ({deleteTarget?.email}) from your company. They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border bg-muted text-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-foreground"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              id="confirm-delete-user"
            >
              {deleteMutation.isPending ? 'Removing…' : 'Remove User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
