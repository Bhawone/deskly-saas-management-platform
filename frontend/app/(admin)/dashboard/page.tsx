'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, Users, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  tickets: {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  users: number;
  recent_tickets: Array<{
    id: number;
    title: string;
    status: string;
    created_at: string;
    user: { id: number; name: string };
  }>;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Ticket }> = {
  open:        { label: 'Open',        color: 'status-open',        icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'status-in_progress', icon: Clock },
  resolved:    { label: 'Resolved',    color: 'status-resolved',    icon: CheckCircle2 },
  closed:      { label: 'Closed',      color: 'status-closed',      icon: XCircle },
};

export default function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
  });

  const kpiCards = [
    {
      title: 'Total Tickets',
      value: data?.tickets.total ?? '—',
      icon: Ticket,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
      href: '/tickets',
    },
    {
      title: 'Open Tickets',
      value: data?.tickets.open ?? '—',
      icon: AlertCircle,
      color: 'text-blue-400',
      bg: 'bg-blue-500/15',
      href: '/tickets?status=open',
    },
    {
      title: 'In Progress',
      value: data?.tickets.in_progress ?? '—',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      href: '/tickets?status=in_progress',
    },
    {
      title: 'Team Members',
      value: data?.users ?? '—',
      icon: Users,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      href: '/users',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-foreground">
          Good {getTimeOfDay()},{' '}
          <span className="gradient-text">{user?.name.split(' ')[0]}</span> 👋
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Here&apos;s what&apos;s happening with {user?.company?.name || 'your platform'} today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card, i) => (
          <Link key={card.title} href={card.href}>
            <Card
              className={`group border bg-card hover:bg-accent hover:border-emerald-500 transition-all duration-300 cursor-pointer animate-fade-in-up`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-8 w-16 rounded shimmer" />
                ) : (
                  <div className="text-3xl font-bold text-foreground">{card.value}</div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Progress bar */}
      {data && data.tickets.total > 0 && (
        <Card className="animate-fade-in-up delay-300 border bg-card">
          <CardHeader>
            <CardTitle className="text-base text-foreground">Ticket Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(statusConfig).map(([status, cfg]) => {
              const count = data.tickets[status as keyof typeof data.tickets] as number;
              const pct = Math.round((count / data.tickets.total) * 100);
              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <cfg.icon className="h-3.5 w-3.5" />
                      {cfg.label}
                    </span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Recent tickets */}
      <Card className="animate-fade-in-up delay-400 border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base text-foreground">Recent Tickets</CardTitle>
          <Link href="/tickets" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            View all →
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg shimmer" />
              ))}
            </div>
          ) : data?.recent_tickets.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">No tickets yet. Create your first one!</p>
          ) : (
            <div className="space-y-2">
              {data?.recent_tickets.map((ticket) => {
                const cfg = statusConfig[ticket.status];
                return (
                  <Link key={ticket.id} href={`/tickets`}>
                    <div className="flex items-center justify-between rounded-lg border border bg-card px-4 py-3 hover:bg-accent transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by {ticket.user.name} · {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge className={`ml-3 flex-shrink-0 text-xs ${cfg?.color}`}>
                        {cfg?.label || ticket.status}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
