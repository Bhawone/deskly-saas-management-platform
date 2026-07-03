'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2, Ticket, Users, Shield, Zap, Globe, ArrowRight,
  Sparkles, ChevronRight, Star, Building2, Lock
} from 'lucide-react';
import { AxiosError } from 'axios';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';

// ── Validation schema ────────────────────────────────────────────────
const onboardSchema = z.object({
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  name:         z.string().min(2, 'Your name must be at least 2 characters'),
  email:        z.string().email('Please enter a valid email address'),
  password:     z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one symbol'),
  subscription_tier: z.enum(['free', 'pro', 'enterprise']).optional(),
});
type OnboardForm = z.infer<typeof onboardSchema>;

// ── Pricing tiers ────────────────────────────────────────────────────
const pricingTiers = [
  {
    name: 'Free',
    price: '₱0',
    period: '/month',
    description: 'Perfect for small teams getting started.',
    tier: 'free' as const,
    badge: null,
    color: 'from-slate-500 to-slate-700',
    features: [
      'Up to 3 team members',
      '50 tickets per month',
      'Email support',
      'Basic analytics',
      'Public knowledge base',
    ],
  },
  {
    name: 'Pro',
    price: '₱2,499',
    period: '/month',
    description: 'For growing teams that need more power.',
    tier: 'pro' as const,
    badge: 'Most Popular',
    color: 'from-emerald-500 to-teal-600',
    features: [
      'Up to 25 team members',
      'Unlimited tickets',
      'Priority support',
      'Advanced analytics',
      'Custom ticket workflows',
      'API access',
      'Slack integration',
    ],
  },
  {
    name: 'Enterprise',
    price: '₱7,499',
    period: '/month',
    description: 'For large organizations with complex needs.',
    tier: 'enterprise' as const,
    badge: 'Best Value',
    color: 'from-teal-500 to-cyan-700',
    features: [
      'Unlimited team members',
      'Unlimited tickets',
      '24/7 dedicated support',
      'Custom reporting & exports',
      'SSO / SAML integration',
      'SLA management',
      'Audit logs',
      'Custom domain',
    ],
  },
];

// ── Features ─────────────────────────────────────────────────────────
const features = [
  { icon: Shield,    title: 'Isolated by Default',     desc: 'Every company\'s data lives in its own lane. No cross-tenant access — ever.' },
  { icon: Zap,       title: 'Built for Speed',          desc: 'Server-side pagination and indexed queries mean no slowdowns as your ticket volume grows.' },
  { icon: Users,     title: 'Granular Permissions',     desc: 'Admins manage the workspace. Employees create and track their own tickets. Clear boundaries, zero confusion.' },
  { icon: Ticket,    title: 'Powerful Ticket Views',   desc: 'Filter by status, date range, or keyword. Sort by any column. Find what you need in seconds.' },
  { icon: Globe,     title: 'One Platform, Many Teams', desc: 'Whether you\'re running one team or fifty, each company gets a fully independent workspace.' },
  { icon: Building2, title: 'Quick Company Setup',      desc: 'Register your company and get your admin account in one step — no back-and-forth required.' },
];

// ── Testimonials ──────────────────────────────────────────────────────
const testimonials = [
  { name: 'Juan Dela Cruz', role: 'Head of Engineering, San Miguel Corp', avatar: 'JD', text: 'We moved from spreadsheets to Deskly in an afternoon. Our response times have never been better — the team actually enjoys using it.' },
  { name: 'Maria Santos',   role: 'Operations Manager, Jollibee Foods',   avatar: 'MS', text: 'The permission system is exactly right. Our junior staff can raise tickets without touching anything they shouldn\'t. Simple and clean.' },
  { name: 'Ramon Bautista', role: 'Founder, Lumos Digital PH',            avatar: 'RB', text: 'Getting started took less than three minutes. Every client we\'ve brought on has their own isolated workspace — no configuration needed.' },
];

export default function LandingPage() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState<'free' | 'pro' | 'enterprise'>('pro');
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardForm>({
    resolver: zodResolver(onboardSchema),
    defaultValues: { subscription_tier: 'pro' },
  });

  const onSubmit = async (data: OnboardForm) => {
    setServerErrors({});
    try {
      const res = await api.post('/companies/onboard', { ...data, subscription_tier: selectedTier });
      const { token, user } = res.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      toast.success(`Welcome to Deskly, ${user.name}!`);
      router.push('/dashboard');
    } catch (err) {
      const axiosErr = err as AxiosError<{ errors?: Record<string, string[]>; message?: string }>;
      if (axiosErr.response?.status === 422 && axiosErr.response.data?.errors) {
        const errs: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(axiosErr.response.data.errors)) {
          errs[key] = Array.isArray(msgs) ? msgs[0] : msgs;
        }
        setServerErrors(errs);
      } else {
        toast.error(axiosErr.response?.data?.message || 'Something went wrong. Please try again.');
      }
    }
  };

  const handleTierSelect = (tier: 'free' | 'pro' | 'enterprise') => {
    setSelectedTier(tier);
    setValue('subscription_tier', tier);
    document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <Ticket className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">Deskly</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing"  className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#signup"   className="text-sm text-muted-foreground hover:text-foreground transition-colors">Get Started</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign in
              </Button>
            </Link>
            <a href="#signup">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25">
                Start Free <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="hero-gradient absolute inset-0 pointer-events-none" />
        <div className="grid-pattern absolute inset-0 pointer-events-none opacity-30" />
        <div className="relative mx-auto max-w-4xl text-center">
            <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-500 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" />
            B2B support ticketing, built for teams
          </div>
          <h1 className="animate-fade-in-up delay-100 mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Your team&apos;s tickets,{' '}
            <span className="gradient-text">under control</span>
          </h1>
          <p className="animate-fade-in-up delay-200 mx-auto mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Deskly gives every company on your platform a private, fully-isolated workspace
            to manage support tickets, team members, and requests — without the complexity.
          </p>
          <div className="animate-fade-in-up delay-300 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="#signup">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 shadow-xl shadow-emerald-500/30 glow-primary transition-all duration-300 hover:scale-105">
                Start for Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href="/login">
              <Button variant="outline" size="lg" className="px-8 bg-transparent">
                Sign In to Dashboard
              </Button>
            </Link>
          </div>
          <div className="animate-fade-in-up delay-400 mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-amber-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-amber-500" /> Set up in 2 minutes</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-amber-500" /> Cancel any time</span>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <section className="border-y bg-muted/30 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {[
            { value: '8,400+', label: 'Tickets Closed' },
            { value: '320+',   label: 'Teams Using Deskly' },
            { value: '99.8%',  label: 'Uptime (last 12 months)' },
            { value: '~3min',  label: 'Median Onboard Time' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 overflow-hidden">
        <motion.div
          className="mx-auto max-w-7xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-16 text-center">
            <Badge className="mb-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-300">
              Why teams switch to Deskly
            </Badge>
            <h2 className="text-4xl font-bold md:text-5xl">
              Less admin overhead,{' '}
              <span className="gradient-text">more resolved tickets</span>
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card
                  className="group h-full bg-card hover:bg-muted/50 hover:border-emerald-500/40 transition-all duration-300"
                >
                  <CardHeader>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 bg-muted/20 overflow-hidden">
        <motion.div
          className="mx-auto max-w-7xl"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-16 text-center">
            <Badge className="mb-4 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-300">
              Simple Pricing
            </Badge>
            <h2 className="text-4xl font-bold md:text-5xl">
              Start free,{' '}
              <span className="gradient-text">scale as you grow</span>
            </h2>
            <p className="mt-4 text-muted-foreground">No hidden fees. No surprises. Cancel any time.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {pricingTiers.map((tier, i) => {
              const isPopular = tier.tier === 'pro';
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  <Card
                    className={`relative flex flex-col h-full overflow-hidden transition-all duration-300 cursor-pointer hover:scale-[1.02] bg-card
                      ${isPopular
                        ? 'border-emerald-500/60 shadow-xl shadow-emerald-500/10'
                        : 'hover:border-foreground/20'
                      }`}
                    onClick={() => handleTierSelect(tier.tier)}
                  >
                    {tier.badge && (
                      <div className="absolute top-0 right-0">
                        <div className={`bg-gradient-to-l ${tier.color} px-3 py-1 text-xs font-semibold text-white rounded-bl-xl`}>
                          {tier.badge}
                        </div>
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <div className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tier.color}`}>
                        <Ticket className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-xl">{tier.name}</CardTitle>
                      <CardDescription className="text-muted-foreground">{tier.description}</CardDescription>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold">{tier.price}</span>
                        <span className="text-muted-foreground text-sm">{tier.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-4">
                      <ul className="space-y-2.5">
                        {tier.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-amber-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-4">
                        <Button
                          className={`w-full ${isPopular
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                            : ''}`}
                          variant={isPopular ? 'default' : 'outline'}
                          onClick={(e) => { e.stopPropagation(); handleTierSelect(tier.tier); }}
                        >
                          Get Started <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────── */}
      <section className="py-24 px-6 overflow-hidden">
        <motion.div
          className="mx-auto max-w-7xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold">Loved by teams worldwide</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
              >
                <Card className="bg-card h-full">
                  <CardContent className="pt-6">
                    <div className="mb-4 flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mb-6 text-muted-foreground text-sm leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        {t.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Signup Form ────────────────────────────────────────────── */}
      <section id="signup" className="py-24 px-6 bg-muted/20 overflow-hidden">
        <motion.div
          className="mx-auto max-w-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
        >
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20">
              <Lock className="h-7 w-7 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold">Create your company</h2>
            <p className="mt-2 text-muted-foreground">
              Selected:{' '}
              <span className="font-semibold text-emerald-500 dark:text-emerald-400 capitalize">{selectedTier}</span> plan
            </p>
          </div>

          <Card className="bg-card backdrop-blur shadow-2xl">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="onboard-form">
                {/* Company Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="company_name" className="text-foreground">Company Name</Label>
                  <Input
                    id="company_name"
                    placeholder="San Miguel Corp"
                    {...register('company_name')}
                    className={`bg-background text-foreground focus:border-emerald-500
                      ${(errors.company_name || serverErrors.company_name) ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {(errors.company_name || serverErrors.company_name) && (
                    <p className="text-xs text-red-500">{errors.company_name?.message || serverErrors.company_name}</p>
                  )}
                </div>

                {/* Admin Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-foreground">Your Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Juan Dela Cruz"
                    {...register('name')}
                    className={`bg-background text-foreground focus:border-emerald-500
                      ${(errors.name || serverErrors.name) ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {(errors.name || serverErrors.name) && (
                    <p className="text-xs text-red-500">{errors.name?.message || serverErrors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-foreground">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    {...register('email')}
                    className={`bg-background text-foreground focus:border-emerald-500
                      ${(errors.email || serverErrors.email) ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {(errors.email || serverErrors.email) && (
                    <p className="text-xs text-red-500">{errors.email?.message || serverErrors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
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
                        toast.success('Strong password generated!');
                      }}
                      className="text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                    >
                      Generate password
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      {...register('password')}
                      className={`bg-background text-foreground focus:border-emerald-500 pr-10
                        ${(errors.password || serverErrors.password) ? 'border-red-500 focus:border-red-500' : ''}`}
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
                    <p className="text-xs text-red-500">{errors.password?.message || serverErrors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 py-5"
                  disabled={isSubmitting}
                  id="submit-onboard"
                >
                  {isSubmitting ? (
                     <span className="flex items-center gap-2">
                       <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                       Creating your account…
                     </span>
                  ) : (
                     <span className="flex items-center gap-2">
                       Create Company Account <ArrowRight className="h-4 w-4" />
                     </span>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="text-emerald-500 dark:text-emerald-400 hover:underline underline-offset-2">
                    Sign in
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t py-10 px-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500">
            <Ticket className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold text-foreground">Deskly</span>
        </div>
        <p>© {new Date().getFullYear()} Deskly. B2B support ticketing built for modern teams.</p>
      </footer>
    </div>
  );
}
