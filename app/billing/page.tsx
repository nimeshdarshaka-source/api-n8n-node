'use client';
import { useState, useEffect } from 'react';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FadeIn } from '@/components/ui/animate';
import { CreditCard, Landmark, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (n: number) => `Rs. ${(n ?? 0).toLocaleString()}`;
const d = (x: any) => (x ? new Date(x).toLocaleDateString() : '-');

export default function BillingPage() {
  const [data, setData] = useState<any>(null);
  const [months, setMonths] = useState<1 | 12>(1);
  const [busy, setBusy] = useState(false);
  const [bankInfo, setBankInfo] = useState<any>(null);

  const fetch_ = () => {
    fetch('/api/billing').then((r: any) => r?.json?.()).then((x: any) => setData(x?.error ? null : x)).catch(() => {});
  };
  useEffect(() => { fetch_(); }, []);

  const buy = async (plan: string, method: 'payhere' | 'bank') => {
    setBusy(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, months, method }),
      });
      const x = await res.json();
      if (!res.ok) { toast.error(x?.error ?? 'Failed'); return; }
      if (x?.manual) {
        setBankInfo(x);
        fetch_();
        return;
      }
      // Auto-submit PayHere form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = x.action;
      Object.entries(x.fields ?? {}).forEach(([k, v]) => {
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = k; input.value = String(v);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch { toast.error('Error'); } finally { setBusy(false); }
  };

  if (!data) return <ClinicLayout><div className="p-6"><div className="h-48 bg-muted animate-pulse rounded-lg" /></div></ClinicLayout>;

  const s = data.state ?? {};
  const isOwner = data.role === 'owner';

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1100px] mx-auto">
        <FadeIn>
          <PageHeader title="Billing" description={`${data?.org?.name ?? ''} — subscription and payments`} />
        </FadeIn>

        <FadeIn delay={0.05}>
          <Card className={s.blocked ? 'border-destructive' : s.expired ? 'border-orange-400' : ''}>
            <CardContent className="pt-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Current plan</p>
                <p className="text-2xl font-bold capitalize">{s.plan ?? 'trial'}
                  {s.blocked ? <Badge variant="destructive" className="ml-2">Blocked</Badge>
                    : s.expired ? <Badge variant="destructive" className="ml-2">Expired (grace period)</Badge>
                    : <Badge variant="outline" className="ml-2">Active</Badge>}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{s.expired ? 'Expired on' : 'Valid until'}</p>
                <p className="text-lg font-semibold">{d(s.expiresAt)}{!s.expired && s.daysLeft > 0 ? ` (${s.daysLeft} days left)` : ''}</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={months === 1 ? 'default' : 'outline'} onClick={() => setMonths(1)}>Monthly</Button>
            <Button size="sm" variant={months === 12 ? 'default' : 'outline'} onClick={() => setMonths(12)}>Annual (pay {data.annualMonthsCharged}, get 12)</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-3">
            {Object.entries(data.plans ?? {}).map(([key, p]: any) => (
              <Card key={key} className={s.plan === key ? 'border-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {p.name}
                    <span className="text-primary">{fmt(months === 12 ? p.monthlyLkr * data.annualMonthsCharged : p.monthlyLkr)}<span className="text-xs text-muted-foreground font-normal">/{months === 12 ? 'year' : 'month'}</span></span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{p.blurb}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />{p.maxUsers >= 999 ? 'Unlimited team logins' : `Up to ${p.maxUsers} team logins`}</p>
                  {isOwner ? (
                    <div className="flex gap-2">
                      <Button className="flex-1" disabled={busy} onClick={() => buy(key, 'payhere')}><CreditCard className="h-4 w-4 mr-2" />Pay Online</Button>
                      <Button className="flex-1" variant="outline" disabled={busy} onClick={() => buy(key, 'bank')}><Landmark className="h-4 w-4 mr-2" />Bank Transfer</Button>
                    </div>
                  ) : <p className="text-xs text-muted-foreground">Only the owner can make payments.</p>}
                </CardContent>
              </Card>
            ))}
          </div>
          {!data.payhereConfigured && <p className="text-xs text-muted-foreground mt-2">Online card payments are not enabled yet — bank transfer is available.</p>}
        </FadeIn>

        <FadeIn delay={0.15}>
          <Card>
            <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Plan</TableHead><TableHead>Months</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(data.payments ?? []).map((p: any) => (
                    <TableRow key={p?.id}>
                      <TableCell>{d(p?.createdAt)}</TableCell>
                      <TableCell className="capitalize">{p?.plan}</TableCell>
                      <TableCell>{p?.months}</TableCell>
                      <TableCell className="capitalize">{p?.method}</TableCell>
                      <TableCell className="text-xs">{p?.reference || p?.id?.slice(-8)?.toUpperCase()}</TableCell>
                      <TableCell className="text-right">{fmt(p?.amount)}</TableCell>
                      <TableCell>{p?.status === 'confirmed' ? <Badge variant="outline">Confirmed</Badge> : p?.status === 'failed' ? <Badge variant="destructive">Failed</Badge> : <Badge variant="secondary">Pending</Badge>}</TableCell>
                    </TableRow>
                  ))}
                  {(data.payments?.length ?? 0) === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No payments yet — you are on the free trial</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </FadeIn>

        <Dialog open={!!bankInfo} onOpenChange={(o) => !o && setBankInfo(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Bank Transfer Instructions</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <p>Transfer <b>{fmt(bankInfo?.amount)}</b> to:</p>
              <p className="p-3 bg-muted rounded-lg whitespace-pre-wrap">{data.bankDetails}</p>
              <p>Use this reference so we can match your payment: <b className="text-primary">{bankInfo?.reference}</b></p>
              <p className="text-xs text-muted-foreground">Your plan is activated when the transfer is confirmed (normally within one working day). It will appear as Pending in the history below until then.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ClinicLayout>
  );
}
