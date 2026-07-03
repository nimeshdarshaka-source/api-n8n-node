'use client';
import { useState, useEffect } from 'react';
import { ClinicLayout } from '@/components/clinic-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layouts/page-header';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';
import {
  Users, CalendarCheck, DollarSign, TrendingUp, Package, Receipt,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const DashboardCharts = dynamic(() => import('@/components/dashboard-charts'), { ssr: false, loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg" /> });

interface DashboardData {
  todayPatients: number;
  todayIncome: number;
  todayExpenses: number;
  monthRevenue: number;
  monthExpenses: number;
  monthDrugCost: number;
  monthProfit: number;
  totalPatients: number;
  lowStockCount: number;
  recentVisits: any[];
  monthlyChart: any[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r: any) => r?.json?.())
      .then((d: any) => setData(d ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Today Patients', value: data?.todayPatients ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { label: 'Today Income', value: `$${(data?.todayIncome ?? 0)?.toFixed?.(2) ?? '0.00'}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { label: 'Today Expenses', value: `$${(data?.todayExpenses ?? 0)?.toFixed?.(2) ?? '0.00'}`, icon: Receipt, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40' },
    { label: 'Total Patients', value: data?.totalPatients ?? 0, icon: Activity, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40' },
  ];

  const monthStats = [
    { label: 'Monthly Revenue', value: data?.monthRevenue ?? 0, icon: TrendingUp, trend: 'up' },
    { label: 'Drug Costs', value: data?.monthDrugCost ?? 0, icon: Package, trend: 'down' },
    { label: 'Other Expenses', value: data?.monthExpenses ?? 0, icon: Receipt, trend: 'down' },
    { label: 'Net Profit', value: data?.monthProfit ?? 0, icon: DollarSign, trend: (data?.monthProfit ?? 0) >= 0 ? 'up' : 'down' },
  ];

  if (loading) {
    return (
      <ClinicLayout>
        <div className="p-6 space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map((i: number) => <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />)}
          </div>
        </div>
      </ClinicLayout>
    );
  }

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Dashboard" description="Overview of your clinic operations" />
        </FadeIn>

        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats?.map?.((s: any, i: number) => (
            <StaggerItem key={i}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{s?.label ?? ''}</p>
                      <p className="text-2xl font-bold font-display tracking-tight mt-1">{s?.value ?? 0}</p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${s?.bg ?? ''}`}>
                      {s?.icon && <s.icon className={`h-5 w-5 ${s?.color ?? ''}`} />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          )) ?? []}
        </Stagger>

        <FadeIn delay={0.2}>
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Monthly Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {monthStats?.map?.((s: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-1">
                      {s?.icon && <s.icon className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground">{s?.label ?? ''}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold font-mono">${(s?.value ?? 0)?.toFixed?.(2) ?? '0.00'}</span>
                      {s?.trend === 'up' ? <ArrowUpRight className="h-4 w-4 text-emerald-500" /> : <ArrowDownRight className="h-4 w-4 text-rose-500" />}
                    </div>
                  </div>
                )) ?? []}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <DashboardCharts data={data?.monthlyChart ?? []} />
        </FadeIn>

        <FadeIn delay={0.4}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-display">Recent Visits</CardTitle>
                <Link href="/visits" className="text-sm text-primary hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent>
              {(data?.recentVisits?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No recent visits</p>
              ) : (
                <div className="space-y-2">
                  {data?.recentVisits?.map?.((v: any) => (
                    <div key={v?.id ?? Math.random()} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{v?.patient?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">Dr. {v?.doctor?.name ?? 'Unknown'}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <Badge variant={v?.status === 'completed' ? 'default' : 'secondary'} className="text-xs">{v?.status ?? 'pending'}</Badge>
                        <span className="text-sm font-mono font-medium">${(v?.totalAmount ?? 0)?.toFixed?.(2) ?? '0.00'}</span>
                      </div>
                    </div>
                  )) ?? []}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {(data?.lowStockCount ?? 0) > 0 && (
          <FadeIn delay={0.5}>
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Package className="h-5 w-5 text-amber-500" />
                <p className="text-sm"><strong>{data?.lowStockCount ?? 0}</strong> inventory items below minimum stock level</p>
                <Link href="/inventory" className="ml-auto text-sm text-primary hover:underline">View</Link>
              </CardContent>
            </Card>
          </FadeIn>
        )}
      </div>
    </ClinicLayout>
  );
}
