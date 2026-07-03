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
import { Package, Plus, AlertTriangle, ArrowUpFromLine, ChevronDown, ChevronRight, Clock, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import React from 'react';

const fmt = (n: number) => `Rs. ${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const d = (x: any) => (x ? new Date(x).toLocaleDateString() : '-');
const daysTo = (x: any) => Math.ceil((new Date(x).getTime() - Date.now()) / 86400000);

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [outOpen, setOutOpen] = useState(false);
  const [adjOpen, setAdjOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Medicine', unit: 'pcs', dosageForm: '', minStock: '10', sellingPrice: '' });
  const [outForm, setOutForm] = useState({ brandId: '', quantity: '', notes: '' });
  const [adjForm, setAdjForm] = useState({ batchId: '', type: 'ADJUSTMENT', quantity: '', notes: '' });

  const fetch_ = () => {
    setLoading(true);
    fetch('/api/inventory').then((r: any) => r?.json?.()).then((data: any) => setItems(Array.isArray(data) ? data : [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetch_(); }, []);

  const allBrands = items.flatMap((it: any) => (it?.brands ?? []).map((b: any) => ({ ...b, itemName: it?.name })));
  const allBatches = allBrands.flatMap((b: any) => (b?.batches ?? []).map((x: any) => ({ ...x, brandName: b?.name, itemName: b?.itemName })));

  const lowStockCount = items.filter((i: any) => i?.lowStock).length;
  const expiringSoon = allBatches.filter((b: any) => { const dt = daysTo(b?.expiryDate); return dt >= 0 && dt <= 90; });
  const expired = allBatches.filter((b: any) => daysTo(b?.expiryDate) < 0);
  const totalValue = items.reduce((s: number, i: any) => s + (i?.stockValue ?? 0), 0);

  const post = async (url: string, body: any, ok: string, close: () => void) => {
    setSaving(true);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.error ?? 'Failed'); return; }
      toast.success(ok); close(); fetch_();
    } catch { toast.error('Error'); } finally { setSaving(false); }
  };

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Inventory" description="Batch and expiry tracked stock — dispensing follows FEFO (First Expiry, First Out)" actions={
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setOutOpen(true)}><ArrowUpFromLine className="h-4 w-4 mr-2" />Dispense (FEFO)</Button>
              <Button variant="outline" onClick={() => setAdjOpen(true)}><Wrench className="h-4 w-4 mr-2" />Adjust</Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Item</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Generic Item</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => { e.preventDefault(); post('/api/inventory', form, 'Item added', () => { setOpen(false); setForm({ name: '', category: 'Medicine', unit: 'pcs', dosageForm: '', minStock: '10', sellingPrice: '' }); }); }} className="space-y-4">
                    <div className="space-y-2"><Label>Generic Name *</Label><Input value={form.name} onChange={(e: any) => setForm((p) => ({ ...p, name: e?.target?.value ?? '' }))} required /></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e: any) => setForm((p) => ({ ...p, category: e?.target?.value ?? '' }))} /></div>
                      <div className="space-y-2"><Label>Unit</Label><Input value={form.unit} onChange={(e: any) => setForm((p) => ({ ...p, unit: e?.target?.value ?? '' }))} /></div>
                      <div className="space-y-2"><Label>Dosage Form</Label><Input placeholder="tablet" value={form.dosageForm} onChange={(e: any) => setForm((p) => ({ ...p, dosageForm: e?.target?.value ?? '' }))} /></div>
                    </div>
                    <div className="space-y-2"><Label>Reorder Level</Label><Input type="number" value={form.minStock} onChange={(e: any) => setForm((p) => ({ ...p, minStock: e?.target?.value ?? '' }))} /></div>
                    <p className="text-xs text-muted-foreground">Stock comes in via Purchases → New Invoice (creates batches with expiry and real unit cost). Add brands from that screen.</p>
                    <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Saving...' : 'Add Item'}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          } />
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Stock Value (at cost)</p><p className="text-xl font-bold">{fmt(totalValue)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Low Stock Items</p><p className="text-xl font-bold text-amber-600">{lowStockCount}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Expiring in 90 days</p><p className="text-xl font-bold text-orange-600">{expiringSoon.length}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Expired Batches</p><p className="text-xl font-bold text-destructive">{expired.length}</p></CardContent></Card>
          </div>
        </FadeIn>

        <Dialog open={outOpen} onOpenChange={setOutOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Dispense Stock (FEFO)</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); post('/api/inventory/stock', { ...outForm, type: 'OUT' }, 'Dispensed using FEFO', () => { setOutOpen(false); setOutForm({ brandId: '', quantity: '', notes: '' }); }); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Brand *</Label>
                <select className="w-full border rounded-md p-2 bg-background text-sm" value={outForm.brandId} onChange={(e: any) => setOutForm((p) => ({ ...p, brandId: e?.target?.value ?? '' }))} required>
                  <option value="">Select brand...</option>
                  {allBrands.map((b: any) => {
                    const stock = (b?.batches ?? []).reduce((s: number, x: any) => s + (x?.remainingQty ?? 0), 0);
                    return <option key={b?.id} value={b?.id ?? ''}>{b?.name ?? ''} {b?.strength ?? ''} - {b?.itemName ?? ''} (Stock: {stock})</option>;
                  })}
                </select>
              </div>
              <div className="space-y-2"><Label>Quantity *</Label><Input type="number" min="1" value={outForm.quantity} onChange={(e: any) => setOutForm((p) => ({ ...p, quantity: e?.target?.value ?? '' }))} required /></div>
              <div className="space-y-2"><Label>Notes</Label><Input value={outForm.notes} onChange={(e: any) => setOutForm((p) => ({ ...p, notes: e?.target?.value ?? '' }))} /></div>
              <p className="text-xs text-muted-foreground">Deducts from the earliest-expiring non-expired batches first and records cost + profit per batch.</p>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Processing...' : 'Dispense'}</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={adjOpen} onOpenChange={setAdjOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Stock Adjustment</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); post('/api/inventory/stock', adjForm, 'Adjustment recorded', () => { setAdjOpen(false); setAdjForm({ batchId: '', type: 'ADJUSTMENT', quantity: '', notes: '' }); }); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Batch *</Label>
                <select className="w-full border rounded-md p-2 bg-background text-sm" value={adjForm.batchId} onChange={(e: any) => setAdjForm((p) => ({ ...p, batchId: e?.target?.value ?? '' }))} required>
                  <option value="">Select batch...</option>
                  {allBatches.map((b: any) => <option key={b?.id} value={b?.id ?? ''}>{b?.brandName ?? ''} - {b?.batchNumber ?? ''} (Rem: {b?.remainingQty ?? 0}, Exp: {d(b?.expiryDate)})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select className="w-full border rounded-md p-2 bg-background text-sm" value={adjForm.type} onChange={(e: any) => setAdjForm((p) => ({ ...p, type: e?.target?.value ?? '' }))}>
                    <option value="ADJUSTMENT">Adjustment</option><option value="EXPIRED">Write off expired</option><option value="RETURN">Return to supplier</option>
                  </select>
                </div>
                <div className="space-y-2"><Label>Qty (+/-) *</Label><Input type="number" placeholder="-5" value={adjForm.quantity} onChange={(e: any) => setAdjForm((p) => ({ ...p, quantity: e?.target?.value ?? '' }))} required /></div>
              </div>
              <div className="space-y-2"><Label>Reason / Notes</Label><Input value={adjForm.notes} onChange={(e: any) => setAdjForm((p) => ({ ...p, notes: e?.target?.value ?? '' }))} /></div>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Processing...' : 'Record Adjustment'}</Button>
            </form>
          </DialogContent>
        </Dialog>

        <FadeIn delay={0.1}>
          {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : items.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
              No items yet. Add a generic item, then record a purchase invoice to receive stock.
            </CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Item</TableHead><TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Value</TableHead>
                  <TableHead>Alerts</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {items.map((it: any) => {
                    const isOpen = !!expanded[it?.id];
                    const batches = (it?.brands ?? []).flatMap((b: any) => (b?.batches ?? []).map((x: any) => ({ ...x, brandName: `${b?.name ?? ''} ${b?.strength ?? ''}`.trim() })));
                    return (
                      <React.Fragment key={it?.id}>
                        <TableRow className="cursor-pointer" onClick={() => setExpanded((p) => ({ ...p, [it?.id]: !p[it?.id] }))}>
                          <TableCell>{isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                          <TableCell className="font-medium">{it?.name ?? ''}<p className="text-xs text-muted-foreground">{(it?.brands ?? []).length} brand(s)</p></TableCell>
                          <TableCell>{it?.category ?? ''}</TableCell>
                          <TableCell className="text-right">{it?.totalStock ?? 0} {it?.unit ?? ''}</TableCell>
                          <TableCell className="text-right">{fmt(it?.stockValue)}</TableCell>
                          <TableCell className="space-x-1">
                            {it?.lowStock && <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="h-3 w-3 mr-1" />Low</Badge>}
                            {(it?.expiringSoonQty ?? 0) > 0 && <Badge variant="secondary" className="text-[10px]"><Clock className="h-3 w-3 mr-1" />Expiring</Badge>}
                            {(it?.expiredQty ?? 0) > 0 && <Badge variant="destructive" className="text-[10px]">Expired</Badge>}
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/30 p-3">
                              {batches.length === 0 ? <p className="text-sm text-muted-foreground px-2">No stock batches. Receive stock via a purchase invoice.</p> : (
                                <Table>
                                  <TableHeader><TableRow>
                                    <TableHead>Brand</TableHead><TableHead>Batch</TableHead><TableHead>Supplier</TableHead>
                                    <TableHead>Expiry</TableHead><TableHead className="text-right">Remaining</TableHead>
                                    <TableHead className="text-right">Real Unit Cost</TableHead><TableHead className="text-right">Selling</TableHead>
                                  </TableRow></TableHeader>
                                  <TableBody>
                                    {batches.map((b: any) => {
                                      const dt = daysTo(b?.expiryDate);
                                      return (
                                        <TableRow key={b?.id}>
                                          <TableCell>{b?.brandName ?? ''}</TableCell>
                                          <TableCell>{b?.batchNumber ?? ''}</TableCell>
                                          <TableCell className="text-xs">{b?.supplier?.name ?? '-'}</TableCell>
                                          <TableCell>
                                            <span className={dt < 0 ? 'text-destructive font-medium' : dt <= 90 ? 'text-orange-600 font-medium' : ''}>
                                              {d(b?.expiryDate)}{dt >= 0 ? ` (${dt}d)` : ' (expired)'}
                                            </span>
                                          </TableCell>
                                          <TableCell className="text-right">{b?.remainingQty ?? 0}</TableCell>
                                          <TableCell className="text-right">Rs. {(b?.realUnitCost ?? 0).toFixed(4)}</TableCell>
                                          <TableCell className="text-right">{fmt(b?.sellingPrice)}</TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              )}
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </FadeIn>
      </div>
    </ClinicLayout>
  );
}
