'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FadeIn } from '@/components/ui/animate';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

type Line = {
  brandId: string; batchNumber: string; expiryDate: string;
  purchasedQty: string; freeQty: string; unitPrice: string; totalPaidCost: string; sellingPrice: string;
};
const emptyLine = (): Line => ({ brandId: '', batchNumber: '', expiryDate: '', purchasedQty: '', freeQty: '0', unitPrice: '', totalPaidCost: '', sellingPrice: '' });

const lineCost = (l: Line) => (l.totalPaidCost !== '' ? parseFloat(l.totalPaidCost) || 0 : (parseInt(l.purchasedQty) || 0) * (parseFloat(l.unitPrice) || 0));
const lineRealUnitCost = (l: Line) => {
  const totalQty = (parseInt(l.purchasedQty) || 0) + (parseInt(l.freeQty) || 0);
  return totalQty > 0 ? lineCost(l) / totalQty : 0;
};

export default function NewPurchasePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [head, setHead] = useState({ supplierId: '', invoiceNo: '', invoiceDate: new Date().toISOString().slice(0, 10), dueDate: '', discount: '0', notes: '' });
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandForm, setBrandForm] = useState({ itemId: '', name: '', strength: '', manufacturer: '', defaultSellingPrice: '' });

  const loadRefs = () => {
    fetch('/api/suppliers').then((r: any) => r?.json?.()).then((d: any) => setSuppliers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/brands').then((r: any) => r?.json?.()).then((d: any) => setBrands(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/inventory').then((r: any) => r?.json?.()).then((d: any) => setItems(Array.isArray(d) ? d : [])).catch(() => {});
  };
  useEffect(() => { loadRefs(); }, []);

  const setLine = (i: number, f: keyof Line, v: string) => setLines((p) => p.map((l, idx) => (idx === i ? { ...l, [f]: v } : l)));
  const addLine = () => setLines((p) => [...p, emptyLine()]);
  const removeLine = (i: number) => setLines((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));

  const grossTotal = lines.reduce((s, l) => s + lineCost(l), 0);
  const netTotal = grossTotal - (parseFloat(head.discount) || 0);

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brandForm) });
      const d = await res.json();
      if (!res.ok) { toast.error(d?.error ?? 'Failed'); return; }
      toast.success('Brand added');
      setBrandOpen(false);
      setBrandForm({ itemId: '', name: '', strength: '', manufacturer: '', defaultSellingPrice: '' });
      loadRefs();
    } catch { toast.error('Error'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!head.supplierId) { toast.error('Select a supplier'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...head, items: lines }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d?.error ?? 'Failed'); return; }
      toast.success('Invoice recorded — batches and stock created');
      router.push('/purchases');
    } catch { toast.error('Error'); } finally { setSaving(false); }
  };

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/purchases"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button></Link>
          </div>
          <PageHeader title="New Purchase Invoice" description="Recording this invoice creates batches, stock ledger IN entries and the supplier ledger debit in one transaction" />
        </FadeIn>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FadeIn delay={0.05}>
            <Card>
              <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Supplier *</Label>
                  <select className="w-full border rounded-md p-2 bg-background text-sm" value={head.supplierId} onChange={(e: any) => setHead((p) => ({ ...p, supplierId: e?.target?.value ?? '' }))} required>
                    <option value="">Select supplier...</option>
                    {suppliers.map((s: any) => <option key={s?.id} value={s?.id ?? ''}>{s?.name ?? ''}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>Invoice No *</Label><Input value={head.invoiceNo} onChange={(e: any) => setHead((p) => ({ ...p, invoiceNo: e?.target?.value ?? '' }))} required /></div>
                <div className="space-y-2"><Label>Invoice Date *</Label><Input type="date" value={head.invoiceDate} onChange={(e: any) => setHead((p) => ({ ...p, invoiceDate: e?.target?.value ?? '' }))} required /></div>
                <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={head.dueDate} onChange={(e: any) => setHead((p) => ({ ...p, dueDate: e?.target?.value ?? '' }))} /></div>
                <div className="space-y-2"><Label>Discount (Rs.)</Label><Input type="number" step="0.01" value={head.discount} onChange={(e: any) => setHead((p) => ({ ...p, discount: e?.target?.value ?? '' }))} /></div>
                <div className="space-y-2 col-span-2"><Label>Notes</Label><Input value={head.notes} onChange={(e: any) => setHead((p) => ({ ...p, notes: e?.target?.value ?? '' }))} /></div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Items</CardTitle>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setBrandOpen(true)}><Plus className="h-4 w-4 mr-1" />New Brand</Button>
                  <Button type="button" variant="secondary" size="sm" onClick={addLine}><Plus className="h-4 w-4 mr-1" />Add Line</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {lines.map((l, i) => (
                  <div key={i} className="border rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Brand *</Label>
                        <select className="w-full border rounded-md p-2 bg-background text-sm" value={l.brandId} onChange={(e: any) => setLine(i, 'brandId', e?.target?.value ?? '')} required>
                          <option value="">Select brand...</option>
                          {brands.map((b: any) => <option key={b?.id} value={b?.id ?? ''}>{b?.name ?? ''} {b?.strength ?? ''} ({b?.item?.name ?? ''})</option>)}
                        </select>
                      </div>
                      <div className="space-y-1"><Label className="text-xs">Batch No *</Label><Input value={l.batchNumber} onChange={(e: any) => setLine(i, 'batchNumber', e?.target?.value ?? '')} required /></div>
                      <div className="space-y-1"><Label className="text-xs">Expiry *</Label><Input type="date" value={l.expiryDate} onChange={(e: any) => setLine(i, 'expiryDate', e?.target?.value ?? '')} required /></div>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 items-end">
                      <div className="space-y-1"><Label className="text-xs">Qty *</Label><Input type="number" min="1" value={l.purchasedQty} onChange={(e: any) => setLine(i, 'purchasedQty', e?.target?.value ?? '')} required /></div>
                      <div className="space-y-1"><Label className="text-xs">Free Qty</Label><Input type="number" min="0" value={l.freeQty} onChange={(e: any) => setLine(i, 'freeQty', e?.target?.value ?? '')} /></div>
                      <div className="space-y-1"><Label className="text-xs">Unit Price</Label><Input type="number" step="0.0001" value={l.unitPrice} onChange={(e: any) => setLine(i, 'unitPrice', e?.target?.value ?? '')} /></div>
                      <div className="space-y-1"><Label className="text-xs">Total Cost</Label><Input type="number" step="0.01" placeholder={lineCost(l).toFixed(2)} value={l.totalPaidCost} onChange={(e: any) => setLine(i, 'totalPaidCost', e?.target?.value ?? '')} /></div>
                      <div className="space-y-1"><Label className="text-xs">Selling Price</Label><Input type="number" step="0.01" value={l.sellingPrice} onChange={(e: any) => setLine(i, 'sellingPrice', e?.target?.value ?? '')} /></div>
                      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeLine(i)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total qty: {(parseInt(l.purchasedQty) || 0) + (parseInt(l.freeQty) || 0)} • Real unit cost: Rs. {lineRealUnitCost(l).toFixed(4)}
                      {lineRealUnitCost(l) > 0 && (parseFloat(l.sellingPrice) || 0) > 0 &&
                        ` • Margin: ${((((parseFloat(l.sellingPrice) || 0) - lineRealUnitCost(l)) / (parseFloat(l.sellingPrice) || 1)) * 100).toFixed(1)}%`}
                    </p>
                  </div>
                ))}
                <div className="flex justify-end gap-8 pt-2 border-t text-sm">
                  <p>Gross: <span className="font-semibold">Rs. {grossTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
                  <p>Discount: <span className="font-semibold">Rs. {(parseFloat(head.discount) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
                  <p>Net Total: <span className="font-bold text-primary">Rs. {netTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></p>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.15}>
            <Button type="submit" size="lg" disabled={saving}>{saving ? 'Recording...' : 'Record Invoice & Receive Stock'}</Button>
          </FadeIn>
        </form>

        {/* New Brand dialog */}
        <Dialog open={brandOpen} onOpenChange={setBrandOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Brand</DialogTitle></DialogHeader>
            <form onSubmit={handleAddBrand} className="space-y-4">
              <div className="space-y-2">
                <Label>Generic Item *</Label>
                <select className="w-full border rounded-md p-2 bg-background text-sm" value={brandForm.itemId} onChange={(e: any) => setBrandForm((p) => ({ ...p, itemId: e?.target?.value ?? '' }))} required>
                  <option value="">Select item...</option>
                  {items.map((it: any) => <option key={it?.id} value={it?.id ?? ''}>{it?.name ?? ''}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">Add generic items from the Inventory page first.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Brand Name *</Label><Input value={brandForm.name} onChange={(e: any) => setBrandForm((p) => ({ ...p, name: e?.target?.value ?? '' }))} required /></div>
                <div className="space-y-2"><Label>Strength</Label><Input placeholder="500mg" value={brandForm.strength} onChange={(e: any) => setBrandForm((p) => ({ ...p, strength: e?.target?.value ?? '' }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Manufacturer</Label><Input value={brandForm.manufacturer} onChange={(e: any) => setBrandForm((p) => ({ ...p, manufacturer: e?.target?.value ?? '' }))} /></div>
                <div className="space-y-2"><Label>Default Selling Price</Label><Input type="number" step="0.01" value={brandForm.defaultSellingPrice} onChange={(e: any) => setBrandForm((p) => ({ ...p, defaultSellingPrice: e?.target?.value ?? '' }))} /></div>
              </div>
              <Button type="submit" className="w-full">Add Brand</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ClinicLayout>
  );
}
