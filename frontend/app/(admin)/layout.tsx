'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Ticket, LayoutDashboard, Users, LogOut, Settings,
  Building2, Menu, X, CreditCard
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useState } from 'react';
import { toast } from 'sonner';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SuperAdmin', 'CompanyAdmin'] },
  { href: '/tickets',   label: 'Tickets',   icon: Ticket,          roles: ['SuperAdmin', 'CompanyAdmin', 'Employee'] },
  { href: '/users',     label: 'Users',     icon: Users,           roles: ['SuperAdmin', 'CompanyAdmin'] },
  { href: '/billing',   label: 'Billing',   icon: CreditCard,      roles: ['CompanyAdmin'] },
];

const roleBadgeMap: Record<string, string> = {
  SuperAdmin:   'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  CompanyAdmin: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Employee:     'bg-amber-500/20  text-amber-300  border-amber-500/30',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (!isLoading && isAuthenticated && user) {
      if ((pathname === '/dashboard' || pathname === '/users' || pathname === '/billing') && user.role === 'Employee') {
        router.replace('/tickets');
      }
      if (pathname === '/billing' && user.role === 'SuperAdmin') {
        router.replace('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, router, pathname, user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
      </div>
    );
  }

  const visibleNav = navItems.filter((item) => item.roles.includes(user.role));

  const handleLogout = async () => {
    setLogoutConfirmOpen(false);
    await logout();
    toast.success('Signed out successfully');
    router.push('/login');
  };

  const initials = user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/30">
          <Ticket className="h-4 w-4 text-foreground" />
        </div>
        <div>
          <div className="text-sm font-bold text-foreground leading-none">Deskly</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Support Platform</div>
        </div>
      </div>

      {/* Company info */}
      {user.company && (
        <div className="px-4 py-3 mx-3 mt-3 rounded-lg bg-card border border">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-medium text-foreground truncate">{user.company.name}</span>
          </div>
          <span className="mt-1 inline-block text-[10px] capitalize text-muted-foreground pl-5">
            {user.company.subscription_tier} plan
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
        {visibleNav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
            >
              <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
              {item.label}
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-muted" />

      {/* User footer */}
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-card">
          <Avatar className="h-8 w-8 border border">
            <AvatarFallback className="bg-emerald-500/20 text-emerald-300 text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground truncate">{user.name}</div>
            <Badge className={`mt-0.5 text-[9px] px-1.5 py-0 h-4 border ${roleBadgeMap[user.role]}`}>
              {user.role}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLogoutConfirmOpen(true)}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
          id="logout-btn"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
      
      {/* Logout Confirmation */}
      <AlertDialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <AlertDialogContent className="bg-card border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to sign out of your account? You will need to sign in again to access the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-background hover:bg-accent text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white" onClick={handleLogout}>
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 border-r border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 bg-card border-r border">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-4 border-b border bg-card px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              className="flex lg:hidden h-8 w-8 items-center justify-center rounded-lg hover:bg-muted"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="h-4 w-4 text-foreground" /> : <Menu className="h-4 w-4 text-foreground" />}
            </button>
            <div>
              <h1 className="text-sm font-semibold text-foreground capitalize">
                {pathname.split('/').filter(Boolean).join(' › ') || 'Dashboard'}
              </h1>
              <p className="text-xs text-muted-foreground">{user.company?.name || 'System Administration'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Badge className={`text-xs border ${roleBadgeMap[user.role]}`}>{user.role}</Badge>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
