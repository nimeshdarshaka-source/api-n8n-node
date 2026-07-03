'use client';
import { useState, useEffect } from 'react';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FadeIn } from '@/components/ui/animate';
import { Truck, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', creditLimit: '', defaultCreditDays: '30' });

  const fetch_ = () => {
    setLoading(true);
    fetch('/api/suppliers').then((r: any) => r?.json?.()).then((d: any) => setSuppliers(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetch_(); }, []);

  const update = (f: string, v: string) => setForm((p: any) => ({ ...(p ?? {}), [f]: v }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); toast.error(d?.error ?? 'Failed'); return; }
      toast.success('Supplier added'); setOpen(false);
      setForm({ name: '', contactPerson: '', phone: '', email: '', address: '', creditLimit: '', defaultCreditDays: '30' });
      fetch_();
    } catch { toast.error('Error'); } finally { setSaving(false); }
  };

  const totalOutstanding = suppliers.reduce((s, x) => s + (x?.outstanding ?? 0), 0);

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Suppliers" description={`Total outstanding: Rs. ${totalOutstanding.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Supplier</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                  <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e: any) => update('name', e?.target?.value ?? '')} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Contact Person</Label><Input value={form.contactPerson} onChange={(e: any) => update('contactPerson', e?.target?.value ?? '')} /></div>
                    <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e: any) => update('phone', e?.target?.value ?? '')} /></div>
                  </div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e: any) => update('email', e?.target?.value ?? '')} /></div>
                  <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e: any) => update('address', e?.target?.value ?? '')} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Credit Limit (Rs.)</Label><Input type="number" step="0.01" value={form.creditLimit} onChange={(e: any) => update('creditLimit', e?.target?.value ?? '')} /></div>
                    <div className="space-y-2"><Label>Credit Days</Label><Input type="number" value={form.defaultCreditDays} onChange={(e: any) => update('defaultCreditDays', e?.target?.value ?? '')} /></div>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Saving...' : 'Add Supplier'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          } />
        </FadeIn>

        <FadeIn delay={0.1}>
          {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : suppliers.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Truck className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No suppliers yet. Add your first supplier to start recording purchase invoices.
            </CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right">Invoices</TableHead>
                    <TableHead className="text-right">Total Purchases</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((s: any) => (
                    <TableRow key={s?.id}>
                      <TableCell>
                        <Link href={`/suppliers/${s?.id}`} className="font-medium text-primary hover:underline">{s?.name ?? ''}</Link>
                        {s?.contactPerson ? <p className="text-xs text-muted-foreground">{s.contactPerson}</p> : null}
                      </TableCell>
                      <TableCell className="text-sm">{s?.phone ?? ''}</TableCell>
                      <TableCell className="text-right">{s?._count?.invoices ?? 0}</TableCell>
                      <TableCell className="text-right">Rs. {(s?.totalPurchases ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={(s?.outstanding ?? 0) > 0 ? 'text-destructive' : ''}>Rs. {(s?.outstanding ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </TableCell>
                      <TableCell>
                        {(s?.outstanding ?? 0) > 0 && s?.creditLimit > 0 && s.outstanding > s.creditLimit
                          ? <Badge variant="destructive">Over limit</Badge>
                          : (s?.outstanding ?? 0) > 0 ? <Badge variant="secondary">Credit due</Badge>
                          : <Badge variant="outline">Settled</Badge>}
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
