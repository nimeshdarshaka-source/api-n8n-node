'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FadeIn } from '@/components/ui/animate';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const fmt = (n: number) => `Rs. ${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const d = (x: any) => (x ? new Date(x).toLocaleDateString() : '-');

export default function PurchaseDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? '';
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/purchases/${id}`).then((r: any) => r?.json?.()).then((data: any) => setInvoice(data?.error ? null : data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ClinicLayout><div className="p-6"><div className="h-48 bg-muted animate-pulse rounded-lg" /></div></ClinicLayout>;
  if (!invoice) return <ClinicLayout><div className="p-6 text-muted-foreground">Invoice not found.</div></ClinicLayout>;

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/purchases"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
          </div>
          <PageHeader
            title={`Invoice ${invoice?.invoiceNo ?? ''}`}
            description={`${invoice?.supplier?.name ?? ''} • ${d(invoice?.invoiceDate)}${invoice?.dueDate ? ` • Due ${d(invoice.dueDate)}` : ''}`}
            actions={invoice?.status === 'paid' ? <Badge variant="outline">Paid</Badge> : invoice?.status === 'partial' ? <Badge variant="secondary">Partial</Badge> : <Badge variant="destructive">Unpaid</Badge>}
          />
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Net Total</p><p className="text-xl font-bold">{fmt(invoice?.netTotal)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Paid</p><p className="text-xl font-bold text-green-600">{fmt(invoice?.paidAmount)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Balance</p><p className="text-xl font-bold text-destructive">{fmt(invoice?.balanceAmount)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Discount</p><p className="text-xl font-bold">{fmt(invoice?.discount)}</p></CardContent></Card>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card>
            <CardHeader><CardTitle className="text-base">Items & Batches</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Brand</TableHead><TableHead>Batch</TableHead><TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Free</TableHead>
                  <TableHead className="text-right">Paid Cost</TableHead><TableHead className="text-right">Real Unit Cost</TableHead>
                  <TableHead className="text-right">Selling</TableHead><TableHead className="text-right">In Stock</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(invoice?.items ?? []).map((it: any) => (
                    <TableRow key={it?.id}>
                      <TableCell>
                        <p className="font-medium">{it?.brand?.name ?? ''} {it?.brand?.strength ?? ''}</p>
                        <p className="text-xs text-muted-foreground">{it?.brand?.item?.name ?? ''}</p>
                      </TableCell>
                      <TableCell>{it?.batchNumber ?? ''}</TableCell>
                      <TableCell>{d(it?.expiryDate)}</TableCell>
                      <TableCell className="text-right">{it?.purchasedQty ?? 0}</TableCell>
                      <TableCell className="text-right">{it?.freeQty ?? 0}</TableCell>
                      <TableCell className="text-right">{fmt(it?.totalPaidCost)}</TableCell>
                      <TableCell className="text-right">Rs. {(it?.realUnitCost ?? 0).toFixed(4)}</TableCell>
                      <TableCell className="text-right">{fmt(it?.sellingPrice)}</TableCell>
                      <TableCell className="text-right">{it?.batch?.remainingQty ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Card>
            <CardHeader><CardTitle className="text-base">Payments Applied</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Allocated</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(invoice?.allocations ?? []).map((a: any) => (
                    <TableRow key={a?.id}>
                      <TableCell>{d(a?.payment?.paymentDate)}</TableCell>
                      <TableCell className="capitalize">{a?.payment?.method ?? ''}</TableCell>
                      <TableCell>{a?.payment?.referenceNo ?? ''}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(a?.allocatedAmount)}</TableCell>
                    </TableRow>
                  ))}
                  {(invoice?.allocations?.length ?? 0) === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No payments yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </ClinicLayout>
  );
}
