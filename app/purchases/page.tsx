'use client';
import { useState, useEffect } from 'react';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FadeIn } from '@/components/ui/animate';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';

const fmt = (n: number) => `Rs. ${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function PurchasesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/purchases').then((r: any) => r?.json?.()).then((d: any) => setInvoices(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalOutstanding = invoices.reduce((s, i) => s + (i?.balanceAmount ?? 0), 0);

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Purchase Invoices" description={`Outstanding payable: ${fmt(totalOutstanding)}`} actions={
            <Link href="/purchases/new"><Button><Plus className="h-4 w-4 mr-2" />New Invoice</Button></Link>
          } />
        </FadeIn>
        <FadeIn delay={0.1}>
          {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : invoices.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No purchase invoices yet. Recording a supplier invoice creates batches and stock automatically.
            </CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Invoice No</TableHead><TableHead>Supplier</TableHead><TableHead>Date</TableHead>
                  <TableHead className="text-right">Items</TableHead><TableHead className="text-right">Net Total</TableHead>
                  <TableHead className="text-right">Balance</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {invoices.map((inv: any) => (
                    <TableRow key={inv?.id}>
                      <TableCell><Link href={`/purchases/${inv?.id}`} className="text-primary hover:underline font-medium">{inv?.invoiceNo ?? ''}</Link></TableCell>
                      <TableCell>{inv?.supplier?.name ?? ''}</TableCell>
                      <TableCell>{inv?.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : ''}</TableCell>
                      <TableCell className="text-right">{inv?._count?.items ?? 0}</TableCell>
                      <TableCell className="text-right">{fmt(inv?.netTotal)}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(inv?.balanceAmount)}</TableCell>
                      <TableCell>
                        {inv?.status === 'paid' ? <Badge variant="outline">Paid</Badge> : inv?.status === 'partial' ? <Badge variant="secondary">Partial</Badge> : <Badge variant="destructive">Unpaid</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </FadeIn>
      </div>
    </ClinicLayout>
  );
}
