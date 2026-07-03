'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FadeIn } from '@/components/ui/animate';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const fmt = (n: number) => `Rs. ${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const d = (x: any) => (x ? new Date(x).toLocaleDateString() : '-');

export default function SupplierDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? '';
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/suppliers/${id}`).then((r: any) => r?.json?.()).then((data: any) => setSupplier(data?.error ? null : data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ClinicLayout><div className="p-6"><div className="h-48 bg-muted animate-pulse rounded-lg" /></div></ClinicLayout>;
  if (!supplier) return <ClinicLayout><div className="p-6 text-muted-foreground">Supplier not found.</div></ClinicLayout>;

  const statusBadge = (s: string) =>
    s === 'paid' ? <Badge variant="outline">Paid</Badge> : s === 'partial' ? <Badge variant="secondary">Partial</Badge> : <Badge variant="destructive">Unpaid</Badge>;

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/suppliers"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
          </div>
          <PageHeader title={supplier?.name ?? ''} description={`${supplier?.contactPerson ?? ''} ${supplier?.phone ?? ''}`.trim() || 'Supplier details'} />
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Outstanding</p><p className="text-xl font-bold text-destructive">{fmt(supplier?.outstanding)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Credit Limit</p><p className="text-xl font-bold">{fmt(supplier?.creditLimit)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Credit Days</p><p className="text-xl font-bold">{supplier?.defaultCreditDays ?? 0}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Invoices</p><p className="text-xl font-bold">{supplier?.invoices?.length ?? 0}</p></CardContent></Card>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Tabs defaultValue="invoices">
            <TabsList>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="ledger">Ledger</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices">
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Invoice No</TableHead><TableHead>Date</TableHead><TableHead>Due</TableHead>
                    <TableHead className="text-right">Net Total</TableHead><TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(supplier?.invoices ?? []).map((inv: any) => (
                      <TableRow key={inv?.id}>
                        <TableCell><Link href={`/purchases/${inv?.id}`} className="text-primary hover:underline">{inv?.invoiceNo ?? ''}</Link></TableCell>
                        <TableCell>{d(inv?.invoiceDate)}</TableCell>
                        <TableCell>{d(inv?.dueDate)}</TableCell>
                        <TableCell className="text-right">{fmt(inv?.netTotal)}</TableCell>
                        <TableCell className="text-right">{fmt(inv?.paidAmount)}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(inv?.balanceAmount)}</TableCell>
                        <TableCell>{statusBadge(inv?.status ?? 'unpaid')}</TableCell>
                      </TableRow>
                    ))}
                    {(supplier?.invoices?.length ?? 0) === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No invoices</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead>
                    <TableHead>Allocated To</TableHead><TableHead className="text-right">Amount</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(supplier?.payments ?? []).map((p: any) => (
                      <TableRow key={p?.id}>
                        <TableCell>{d(p?.paymentDate)}</TableCell>
                        <TableCell className="capitalize">{p?.method ?? ''}</TableCell>
                        <TableCell>{p?.referenceNo ?? ''}</TableCell>
                        <TableCell className="text-xs">{(p?.allocations ?? []).map((a: any) => a?.invoice?.invoiceNo).filter(Boolean).join(', ')}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(p?.amount)}</TableCell>
                      </TableRow>
                    ))}
                    {(supplier?.payments?.length ?? 0) === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="ledger">
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Notes</TableHead>
                    <TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {(supplier?.ledgerEntries ?? []).map((l: any) => (
                      <TableRow key={l?.id}>
                        <TableCell>{d(l?.date)}</TableCell>
                        <TableCell className="capitalize">{l?.transactionType ?? ''}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l?.notes ?? ''}</TableCell>
                        <TableCell className="text-right">{l?.debit ? fmt(l.debit) : '-'}</TableCell>
                        <TableCell className="text-right">{l?.credit ? fmt(l.credit) : '-'}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(l?.runningBalance)}</TableCell>
                      </TableRow>
                    ))}
                    {(supplier?.ledgerEntries?.length ?? 0) === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No ledger entries</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
    </ClinicLayout>
  );
}
