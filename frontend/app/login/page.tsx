'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket, ArrowRight, Lock } from 'lucide-react';
import { AxiosError } from 'axios';
import { ThemeToggle } from '@/components/ThemeToggle';

const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type LoginForm = z.infer<typeof loginSchema>;

const demoAccounts = [
  { label: 'Platform Admin',  email: 'admin@deskly.ph',          role: 'SuperAdmin' },
  { label: 'SMC Admin',       email: 'juan.delacruz@sanmiguel.com.ph', role: 'CompanyAdmin' },
  { label: 'SMC Employee',    email: 'jose.rizal@sanmiguel.com.ph',   role: 'Employee' },
  { label: 'JFC Admin',       email: 'maria.santos@jollibee.com.ph', role: 'CompanyAdmin' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string; errors?: Record<string, string[]> }>;
      const msg =
        axiosErr.response?.data?.errors?.email?.[0] ||
        axiosErr.response?.data?.message ||
        'Login failed. Please try again.';
      setServerError(msg);
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'password');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="hero-gradient absolute inset-0 pointer-events-none" />
      <div className="grid-pattern absolute inset-0 pointer-events-none opacity-20" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center animate-fade-in-up">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
              <Ticket className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Deskly</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-muted-foreground text-sm">Sign in to your workspace</p>
        </div>

        {/* Demo accounts */}
        <div className="animate-fade-in-up delay-100">
          <p className="text-xs text-muted-foreground text-center mb-2">Try a demo account (password: <code className="text-emerald-500 dark:text-emerald-400">password</code>):</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc.email)}
                className="rounded-lg border bg-card px-3 py-2 text-left transition-colors hover:bg-accent hover:border-emerald-500/40"
              >
                <div className="text-xs font-medium text-foreground">{acc.label}</div>
                <div className="text-[10px] text-muted-foreground">{acc.role}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card className="animate-fade-in-up delay-200 bg-card backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> Sign in
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your email and password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="login-form">
              {serverError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400">
                  {serverError}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-foreground">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  {...register('email')}
                  className={`bg-background text-foreground focus:border-emerald-500
                    ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {errors.email && <p className="text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-foreground">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`bg-background text-foreground focus:border-emerald-500
                    ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                />
                {errors.password && <p className="text-xs text-red-500 dark:text-red-400">{errors.password.message}</p>}
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-5 shadow-lg shadow-emerald-500/30"
                disabled={isSubmitting}
                id="login-submit"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Don&apos;t have a workspace yet?{' '}
                <Link href="/#signup" className="text-emerald-500 dark:text-emerald-400 hover:underline underline-offset-2">
                  Create one free
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
