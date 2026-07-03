'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Ticket, Sparkles, CreditCard, ShieldCheck } from 'lucide-react';

const pricingTiers = [
  {
    name: 'Free',
    price: '₱0',
    period: '/month',
    description: 'Perfect for small teams getting started.',
    tier: 'free' as const,
    badge: null,
    color: 'from-slate-500 to-slate-700',
    features: ['Up to 3 team members', '50 tickets per month', 'Email support'],
  },
  {
    name: 'Pro',
    price: '₱2,499',
    period: '/month',
    description: 'For growing teams that need more power.',
    tier: 'pro' as const,
    badge: 'Most Popular',
    color: 'from-emerald-500 to-teal-600',
    features: ['Up to 25 team members', 'Unlimited tickets', 'Priority support', 'Advanced analytics'],
  },
  {
    name: 'Enterprise',
    price: '₱7,499',
    period: '/month',
    description: 'For large organizations with complex needs.',
    tier: 'enterprise' as const,
    badge: 'Best Value',
    color: 'from-teal-500 to-cyan-700',
    features: ['Unlimited team members', 'Unlimited tickets', '24/7 dedicated support', 'Audit logs'],
  },
];

export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  const [checkoutTier, setCheckoutTier] = useState<'free' | 'pro' | 'enterprise' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentTier = user?.company?.subscription_tier || 'free';

  const upgradeMutation = useMutation({
    mutationFn: (tier: string) => api.post('/companies/upgrade', { subscription_tier: tier }),
    onSuccess: async () => {
      await refreshUser();
      toast.success('Subscription upgraded successfully!');
      setCheckoutTier(null);
    },
    onError: () => {
      toast.error('Failed to upgrade subscription.');
      setCheckoutTier(null);
    },
    onSettled: () => setIsProcessing(false),
  });

  const handleSimulatedCheckout = () => {
    if (!checkoutTier) return;
    setIsProcessing(true);
    // Simulate payment processing delay (2 seconds)
    setTimeout(() => {
      upgradeMutation.mutate(checkoutTier);
    }, 2000);
  };

  const selectedPlan = pricingTiers.find(t => t.tier === checkoutTier);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing & Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your company's subscription tier.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border bg-card px-4 py-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium">Current Plan:</span>
          <Badge className="capitalize bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {currentTier}
          </Badge>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid gap-6 md:grid-cols-3 animate-fade-in-up delay-100">
        {pricingTiers.map((tier) => {
          const isCurrent = currentTier === tier.tier;
          return (
            <Card
              key={tier.name}
              className={`relative flex flex-col overflow-hidden transition-all duration-300 bg-card
                ${isCurrent ? 'border-emerald-500/60 ring-1 ring-emerald-500/20 shadow-xl shadow-emerald-500/10' : 'border'}`}
            >
              {isCurrent && (
                <div className="absolute top-0 right-0">
                  <div className="bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 rounded-bl-xl border-b border-l border-emerald-500/30">
                    Current Plan
                  </div>
                </div>
              )}
              <CardHeader className="pb-4 pt-8">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tier.color} shadow-inner`}>
                  <Ticket className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl text-foreground">{tier.name}</CardTitle>
                <CardDescription className="text-muted-foreground min-h-[40px]">{tier.description}</CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-foreground">{tier.price}</span>
                  <span className="text-muted-foreground text-sm">{tier.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-6">
                <ul className="space-y-3 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
                      <span className="leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : (tier.tier === 'free' && currentTier !== 'free' ? 'destructive' : 'default')}
                    disabled={isCurrent}
                    onClick={() => !isCurrent && setCheckoutTier(tier.tier)}
                    id={`upgrade-${tier.tier}-btn`}
                  >
                    {isCurrent 
                      ? 'Active Plan' 
                      : (
                        (() => {
                          const weights: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };
                          const currentWeight = weights[currentTier as string] || 0;
                          const targetWeight = weights[tier.tier] || 0;
                          return targetWeight < currentWeight 
                            ? `Downgrade to ${tier.name}` 
                            : `Upgrade to ${tier.name}`;
                        })()
                      )
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Simulated Checkout Modal */}
      <AlertDialog open={!!checkoutTier} onOpenChange={(o) => !o && !isProcessing && setCheckoutTier(null)}>
        <AlertDialogContent className="bg-card border text-foreground sm:max-w-md">
          {checkoutTier === 'free' ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-foreground">
                  Downgrade to Free?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to downgrade to the Free tier? You will immediately lose access to premium features and increased limits.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4">
                <AlertDialogCancel disabled={isProcessing} className="bg-background hover:bg-accent text-foreground border">
                  Cancel
                </AlertDialogCancel>
                <Button
                  className="bg-red-500 hover:bg-red-600 text-white min-w-[120px]"
                  onClick={handleSimulatedCheckout}
                  disabled={isProcessing}
                  id="confirm-cancel-btn"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Downgrading...
                    </span>
                  ) : (
                    'Yes, Downgrade'
                  )}
                </Button>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-400" />
                  Upgrade to {selectedPlan?.name}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  You will be charged <strong className="text-foreground">{selectedPlan?.price}</strong>{selectedPlan?.period}. This is a simulated checkout.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Card Information</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      disabled
                      value="•••• •••• •••• 4242"
                      className="pl-9 bg-muted border text-foreground"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expiry</Label>
                    <Input disabled value="12/30" className="bg-muted border text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label>CVC</Label>
                    <Input disabled type="password" value="123" className="bg-muted border text-foreground" />
                  </div>
                </div>
                
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 mt-2 flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-300/80 leading-relaxed">
                    Payments are securely processed (Simulated). Your data is never stored on our servers.
                  </p>
                </div>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isProcessing} className="bg-background hover:bg-accent text-foreground border">
                  Cancel
                </AlertDialogCancel>
                <Button
                  className="bg-emerald-500 hover:bg-emerald-600 text-white min-w-[120px]"
                  onClick={handleSimulatedCheckout}
                  disabled={isProcessing}
                  id="confirm-payment-btn"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Pay ${selectedPlan?.price}`
                  )}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
