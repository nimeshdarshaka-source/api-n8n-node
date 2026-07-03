'use client';
import { useState, useEffect } from 'react';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FadeIn } from '@/components/ui/animate';
import { Plus, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (n: number) => `Rs. ${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function SupplierPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [openInvoices, setOpenInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ supplierId: '', paymentDate: new Date().toISOString().slice(0, 10), method: 'cash', amount: '', referenceNo: '', notes: '' });
  const [allocs, setAllocs] = useState<Record<string, string>>({}); // invoiceId -> amount
  const [autoAllocate, setAutoAllocate] = useState(true);

  const fetch_ = () => {
    setLoading(true);
    fetch('/api/supplier-payments').then((r: any) => r?.json?.()).then((d: any) => setPayments(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
    fetch('/api/suppliers').then((r: any) => r?.json?.()).then((d: any) => setSuppliers(Array.isArray(d) ? d : [])).catch(() => {});
  };
  useEffect(() => { fetch_(); }, []);

  // Load open invoices when supplier changes
  useEffect(() => {
    setAllocs({});
    if (!form.supplierId) { setOpenInvoices([]); return; }
    fetch(`/api/suppliers/${form.supplierId}`).then((r: any) => r?.json?.()).then((d: any) => {
      setOpenInvoices((d?.invoices ?? []).filter((i: any) => (i?.balanceAmount ?? 0) > 0));
    }).catch(() => {});
  }, [form.supplierId]);

  const update = (f: string, v: string) => setForm((p: any) => ({ ...(p ?? {}), [f]: v }));
  const allocTotal = Object.values(allocs).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const amt = parseFloat(form.amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoAllocate && allocTotal - amt > 0.001) { toast.error('Allocated total exceeds payment amount'); return; }
    setSaving(true);
    try {
      const body: any = { ...form };
      if (!autoAllocate) {
        body.allocations = Object.entries(allocs)
          .filter(([, v]) => (parseFloat(v) || 0) > 0)
          .map(([invoiceId, v]) => ({ invoiceId, allocatedAmount: parseFloat(v) }));
      }
      const res = await fetch('/api/supplier-payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) { toast.error(d?.error ?? 'Failed'); return; }
      toast.success('Payment recorded and allocated');
      setOpen(false);
      setForm({ supplierId: '', paymentDate: new Date().toISOString().slice(0, 10), method: 'cash', amount: '', referenceNo: '', notes: '' });
      setAllocs({});
      fetch_();
    } catch { toast.error('Error'); } finally { setSaving(false); }
  };

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Supplier Payments" description="Record payments and settle invoices (multi-invoice allocation supported)" actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Record Payment</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Record Supplier Payment</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Supplier *</Label>
                    <select className="w-full border rounded-md p-2 bg-background text-sm" value={form.supplierId} onChange={(e: any) => update('supplierId', e?.target?.value ?? '')} required>
                      <option value="">Select supplier...</option>
                      {suppliers.map((s: any) => <option key={s?.id} value={s?.id ?? ''}>{s?.name ?? ''} (Outstanding: {fmt(s?.outstanding ?? 0)})</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.paymentDate} onChange={(e: any) => update('paymentDate', e?.target?.value ?? '')} required /></div>
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <select className="w-full border rounded-md p-2 bg-background text-sm" value={form.method} onChange={(e: any) => update('method', e?.target?.value ?? '')}>
                        <option value="cash">Cash</option><option value="bank">Bank Transfer</option>
                        <option value="cheque">Cheque</option><option value="card">Card</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Amount (Rs.) *</Label><Input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e: any) => update('amount', e?.target?.value ?? '')} required /></div>
                    <div className="space-y-2"><Label>Reference No</Label><Input placeholder="Cheque / transfer ref" value={form.referenceNo} onChange={(e: any) => update('referenceNo', e?.target?.value ?? '')} /></div>
                  </div>

                  {openInvoices.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="autoAlloc" checked={autoAllocate} onChange={(e: any) => setAutoAllocate(!!e?.target?.checked)} />
                        <Label htmlFor="autoAlloc" className="text-sm font-normal">Auto-allocate to oldest invoices first (FIFO)</Label>
                      </div>
                      {!autoAllocate && (
                        <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                          {openInvoices.map((inv: any) => (
                            <div key={inv?.id} className="flex items-center justify-between gap-3 text-sm">
                              <div>
                                <p className="font-medium">{inv?.invoiceNo ?? ''}</p>
                                <p className="text-xs text-muted-foreground">Balance: {fmt(inv?.balanceAmount)}</p>
                              </div>
                              <Input type="number" step="0.01" min="0" max={inv?.balanceAmount} className="w-28" placeholder="0.00"
                                value={allocs[inv?.id] ?? ''} onChange={(e: any) => setAllocs((p) => ({ ...p, [inv?.id]: e?.target?.value ?? '' }))} />
                            </div>
                          ))}
                          <p className={`text-xs pt-1 border-t ${allocTotal - amt > 0.001 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            Allocated: {fmt(allocTotal)} of {fmt(amt)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={(e: any) => update('notes', e?.target?.value ?? '')} /></div>
                  <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Recording...' : 'Record Payment'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          } />
        </FadeIn>

        <FadeIn delay={0.1}>
          {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : payments.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No supplier payments yet.
            </CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead><TableHead>Supplier</TableHead><TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead><TableHead>Invoices Settled</TableHead><TableHead className="text-right">Amount</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {payments.map((p: any) => (
                    <TableRow key={p?.id}>
                      <TableCell>{p?.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : ''}</TableCell>
                      <TableCell className="font-medium">{p?.supplier?.name ?? ''}</TableCell>
                      <TableCell className="capitalize">{p?.method ?? ''}</TableCell>
                      <TableCell>{p?.referenceNo ?? ''}</TableCell>
                      <TableCell className="text-xs">{(p?.allocations ?? []).map((a: any) => a?.invoice?.invoiceNo).filter(Boolean).join(', ')}</TableCell>
                      <TableCell className="text-right font-medium">{fmt(p?.amount)}</TableCell>
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
