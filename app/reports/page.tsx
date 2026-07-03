'use client';
import { useState, useEffect, useCallback } from 'react';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FadeIn } from '@/components/ui/animate';
import { Download } from 'lucide-react';

const fmt = (n: number) => `Rs. ${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const iso = (d: Date) => d.toISOString().slice(0, 10);

const presets = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = (today.getDay() + 6) % 7; // Monday=0
  const weekStart = new Date(today.getTime() - dow * 86400000);
  return {
    'Today': [today, today],
    'Yesterday': [new Date(today.getTime() - 86400000), new Date(today.getTime() - 86400000)],
    'This Week': [weekStart, today],
    'Last Week': [new Date(weekStart.getTime() - 7 * 86400000), new Date(weekStart.getTime() - 86400000)],
    'This Month': [new Date(now.getFullYear(), now.getMonth(), 1), today],
    'Last Month': [new Date(now.getFullYear(), now.getMonth() - 1, 1), new Date(now.getFullYear(), now.getMonth(), 0)],
    'This Year': [new Date(now.getFullYear(), 0, 1), today],
    'Last Year': [new Date(now.getFullYear() - 1, 0, 1), new Date(now.getFullYear() - 1, 11, 31)],
  } as Record<string, [Date, Date]>;
};

export default function ReportsPage() {
  const p = presets();
  const [from, setFrom] = useState(iso(p['This Month'][0]));
  const [to, setTo] = useState(iso(p['This Month'][1]));
  const [active, setActive] = useState('This Month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback((f: string, t: string) => {
    setLoading(true);
    fetch(`/api/reports?from=${f}&to=${t}`).then((r: any) => r?.json?.()).then((d: any) => setData(d?.error ? null : d)).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(from, to); }, []);

  const pick = (name: string) => {
    const [f, t] = p[name];
    setActive(name); setFrom(iso(f)); setTo(iso(t)); load(iso(f), iso(t));
  };

  const csv = () => {
    if (!data) return;
    const rows: string[][] = [
      ['ClinicPro Report', `${from} to ${to}`], [],
      ['FINANCIAL'], ['Metric', 'Amount'],
      ...Object.entries(data.financial ?? {}).map(([k, v]: any) => [k, String(Number(v).toFixed(2))]), [],
      ['DOCTOR-WISE'], ['Doctor', 'Visits', 'Revenue'],
      ...(data.byDoctor ?? []).map((x: any) => [x.name, String(x.visits), x.revenue.toFixed(2)]), [],
      ['SERVICE-WISE'], ['Service', 'Qty', 'Revenue'],
      ...(data.byService ?? []).map((x: any) => [x.name, String(x.qty), x.revenue.toFixed(2)]), [],
      ['DRUG PROFIT BY BRAND'], ['Brand', 'Qty', 'Sales', 'Cost', 'Profit'],
      ...(data.byBrand ?? []).map((x: any) => [x.name, String(x.qty), x.sales.toFixed(2), x.cost.toFixed(2), x.profit.toFixed(2)]), [],
      ['EXPENSES BY CATEGORY'], ['Category', 'Amount'],
      ...(data.byExpense ?? []).map((x: any) => [x.name, x.amount.toFixed(2)]),
    ];
    const blob = new Blob([rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clinic-report-${from}-to-${to}.csv`;
    a.click();
  };

  const f = data?.financial ?? {};

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Reports" description="Multi-period financial and operational reporting" actions={
            <Button variant="outline" onClick={csv} disabled={!data}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          } />
        </FadeIn>

        <FadeIn delay={0.03}>
          <div className="flex flex-wrap gap-2 items-center">
            {Object.keys(p).map((name) => (
              <Button key={name} size="sm" variant={active === name ? 'default' : 'outline'} onClick={() => pick(name)}>{name}</Button>
            ))}
            <div className="flex items-center gap-2 ml-2">
              <Input type="date" className="w-36" value={from} onChange={(e: any) => setFrom(e?.target?.value ?? '')} />
              <span className="text-muted-foreground text-sm">to</span>
              <Input type="date" className="w-36" value={to} onChange={(e: any) => setTo(e?.target?.value ?? '')} />
              <Button size="sm" variant="secondary" onClick={() => { setActive('Custom'); load(from, to); }}>Apply</Button>
            </div>
          </div>
        </FadeIn>

        {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : !data ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Could not load report.</CardContent></Card>
        ) : (
          <>
            <FadeIn delay={0.05}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Income</p><p className="text-xl font-bold">{fmt(f.totalIncome)}</p><p className="text-[11px] text-muted-foreground">Visits {fmt(f.consultIncome)} + Drugs {fmt(f.drugSales)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Drug Cost (COGS)</p><p className="text-xl font-bold">{fmt(f.drugCost)}</p><p className="text-[11px] text-muted-foreground">Drug profit {fmt(f.drugProfit)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Expenses</p><p className="text-xl font-bold">{fmt(f.totalExpenses)}</p><p className="text-[11px] text-muted-foreground">incl. salaries {fmt(f.salariesPaid)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Net Profit</p><p className={`text-xl font-bold ${f.netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>{fmt(f.netProfit)}</p><p className="text-[11px] text-muted-foreground">Margin {(f.profitMargin ?? 0).toFixed(1)}%</p></CardContent></Card>
              </div>
            </FadeIn>
            <FadeIn delay={0.07}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Patient Visits</p><p className="text-xl font-bold">{data?.patients?.visitCount ?? 0}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Unique Patients</p><p className="text-xl font-bold">{data?.patients?.uniquePatients ?? 0}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Avg Income / Visit</p><p className="text-xl font-bold">{fmt(data?.patients?.avgIncomePerVisit)}</p></CardContent></Card>
                <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Supplier Payments</p><p className="text-xl font-bold">{fmt(f.supplierPaid)}</p></CardContent></Card>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Doctor-wise Revenue</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Doctor</TableHead><TableHead className="text-right">Visits</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {(data?.byDoctor ?? []).map((x: any) => <TableRow key={x?.name}><TableCell>{x?.name}</TableCell><TableCell className="text-right">{x?.visits}</TableCell><TableCell className="text-right">{fmt(x?.revenue)}</TableCell></TableRow>)}
                        {(data?.byDoctor?.length ?? 0) === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No visits in range</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Service-wise Revenue</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Service</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {(data?.byService ?? []).map((x: any) => <TableRow key={x?.name}><TableCell>{x?.name}</TableCell><TableCell className="text-right">{x?.qty}</TableCell><TableCell className="text-right">{fmt(x?.revenue)}</TableCell></TableRow>)}
                        {(data?.byService?.length ?? 0) === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-6">No services in range</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Drug Profit by Brand</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Brand</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Sales</TableHead><TableHead className="text-right">Profit</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {(data?.byBrand ?? []).map((x: any) => <TableRow key={x?.name}><TableCell>{x?.name}</TableCell><TableCell className="text-right">{x?.qty}</TableCell><TableCell className="text-right">{fmt(x?.sales)}</TableCell><TableCell className="text-right">{fmt(x?.profit)}</TableCell></TableRow>)}
                        {(data?.byBrand?.length ?? 0) === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No dispensing in range</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Expenses by Category / Payment Mix</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {(data?.byExpense ?? []).map((x: any) => <TableRow key={x?.name}><TableCell>{x?.name}</TableCell><TableCell className="text-right">{fmt(x?.amount)}</TableCell></TableRow>)}
                        {(data?.byMethod ?? []).map((x: any) => <TableRow key={`m-${x?.name}`}><TableCell className="capitalize text-muted-foreground">Income via {x?.name}</TableCell><TableCell className="text-right text-muted-foreground">{fmt(x?.amount)}</TableCell></TableRow>)}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </FadeIn>
          </>
        )}
      </div>
    </ClinicLayout>
  );
}
