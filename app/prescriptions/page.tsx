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
import { Plus, Trash2, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';

type Line = { brandId: string; qty: string; dosage: string };

export default function PrescriptionsPage() {
  const [rx, setRx] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [head, setHead] = useState({ patientId: '', doctorId: '', notes: '' });
  const [lines, setLines] = useState<Line[]>([{ brandId: '', qty: '', dosage: '' }]);

  const fetch_ = () => {
    setLoading(true);
    fetch('/api/prescriptions').then((r: any) => r?.json?.()).then((d: any) => setRx(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
    fetch('/api/patients').then((r: any) => r?.json?.()).then((d: any) => setPatients(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/doctors').then((r: any) => r?.json?.()).then((d: any) => setDoctors(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/brands').then((r: any) => r?.json?.()).then((d: any) => setBrands(Array.isArray(d) ? d : [])).catch(() => {});
  };
  useEffect(() => { fetch_(); }, []);

  const setLine = (i: number, f: keyof Line, v: string) => setLines((p) => p.map((l, idx) => (idx === i ? { ...l, [f]: v } : l)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch('/api/prescriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...head, items: lines }) });
      const d = await res.json();
      if (!res.ok) { toast.error(d?.error ?? 'Failed'); return; }
      toast.success('Prescription created — confirm to dispense');
      setOpen(false); setHead({ patientId: '', doctorId: '', notes: '' }); setLines([{ brandId: '', qty: '', dosage: '' }]); fetch_();
    } catch { toast.error('Error'); } finally { setSaving(false); }
  };

  const confirm = async (id: string) => {
    const res = await fetch(`/api/prescriptions/${id}/confirm`, { method: 'POST' });
    const d = await res.json();
    if (!res.ok) { toast.error(d?.error ?? 'Failed'); return; }
    toast.success('Dispensed via FEFO — stock deducted'); fetch_();
  };

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Prescriptions" description="Create prescriptions and dispense them with FEFO stock deduction (scan/OCR upload can be added later)" actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New Prescription</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>New Prescription</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Patient *</Label>
                      <select className="w-full border rounded-md p-2 bg-background text-sm" value={head.patientId} onChange={(e: any) => setHead((p) => ({ ...p, patientId: e?.target?.value ?? '' }))} required>
                        <option value="">Select...</option>
                        {patients.map((p: any) => <option key={p?.id} value={p?.id ?? ''}>{p?.name ?? ''}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Doctor</Label>
                      <select className="w-full border rounded-md p-2 bg-background text-sm" value={head.doctorId} onChange={(e: any) => setHead((p) => ({ ...p, doctorId: e?.target?.value ?? '' }))}>
                        <option value="">None</option>
                        {doctors.map((d: any) => <option key={d?.id} value={d?.id ?? ''}>{d?.name ?? ''}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between"><Label>Items</Label><Button type="button" size="sm" variant="secondary" onClick={() => setLines((p) => [...p, { brandId: '', qty: '', dosage: '' }])}><Plus className="h-3.5 w-3.5 mr-1" />Line</Button></div>
                    {lines.map((l, i) => (
                      <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto] gap-2 items-end">
                        <select className="border rounded-md p-2 bg-background text-sm" value={l.brandId} onChange={(e: any) => setLine(i, 'brandId', e?.target?.value ?? '')} required>
                          <option value="">Brand...</option>
                          {brands.map((b: any) => <option key={b?.id} value={b?.id ?? ''}>{b?.name ?? ''} {b?.strength ?? ''} (Stock: {b?.totalStock ?? 0})</option>)}
                        </select>
                        <Input type="number" min="1" placeholder="Qty" value={l.qty} onChange={(e: any) => setLine(i, 'qty', e?.target?.value ?? '')} required />
                        <Input placeholder="1 tds 5/7" value={l.dosage} onChange={(e: any) => setLine(i, 'dosage', e?.target?.value ?? '')} />
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setLines((p) => (p.length > 1 ? p.filter((_, x) => x !== i) : p))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2"><Label>Notes</Label><Input value={head.notes} onChange={(e: any) => setHead((p) => ({ ...p, notes: e?.target?.value ?? '' }))} /></div>
                  <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Saving...' : 'Create Prescription'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          } />
        </FadeIn>
        <FadeIn delay={0.1}>
          {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : rx.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />No prescriptions yet.</CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Items</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rx.map((r: any) => (
                    <TableRow key={r?.id}>
                      <TableCell>{r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</TableCell>
                      <TableCell className="font-medium">{r?.patientName ?? ''}</TableCell>
                      <TableCell>{r?.doctorName || '-'}</TableCell>
                      <TableCell className="text-xs">{(r?.items ?? []).map((i: any) => `${i?.brandName ?? ''} ×${i?.qty ?? 0}${i?.dosage ? ` (${i.dosage})` : ''}`).join(', ')}</TableCell>
                      <TableCell>{r?.status === 'dispensed' ? <Badge variant="outline">Dispensed</Badge> : <Badge variant="secondary">Pending</Badge>}</TableCell>
                      <TableCell className="text-right">
                        {r?.status === 'pending' && <Button size="sm" onClick={() => confirm(r.id)}><Check className="h-3.5 w-3.5 mr-1" />Confirm &amp; Dispense</Button>}
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
