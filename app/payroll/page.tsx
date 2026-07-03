'use client';
import { useState, useEffect } from 'react';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FadeIn } from '@/components/ui/animate';
import { Play, Banknote } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (n: number) => `Rs. ${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function PayrollPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [editForm, setEditForm] = useState({ allowances: '', bonuses: '', advances: '' });

  const fetch_ = () => {
    setLoading(true);
    fetch(`/api/payroll?month=${month}`).then((r: any) => r?.json?.()).then((d: any) => setRows(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetch_(); }, [month]);

  const generate = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ month }) });
      const d = await res.json();
      if (!res.ok) { toast.error(d?.error ?? 'Failed'); return; }
      toast.success('Payroll generated from salary rules + attendance'); fetch_();
    } catch { toast.error('Error'); } finally { setBusy(false); }
  };

  const save = async (id: string, extra: any = {}) => {
    const res = await fetch(`/api/payroll/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editForm, ...extra }) });
    const d = await res.json();
    if (!res.ok) { toast.error(d?.error ?? 'Failed'); return; }
    toast.success(extra?.status === 'paid' ? 'Marked paid (salary expense recorded)' : 'Saved');
    setEdit(null); fetch_();
  };

  const total = rows.reduce((s, r) => s + (r?.netSalary ?? 0), 0);
  const paid = rows.filter((r) => r?.status === 'paid').reduce((s, r) => s + (r?.netSalary ?? 0), 0);

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Payroll" description="Net = Base + Allowances + Bonuses + Overtime − Deductions − Advances" actions={
            <div className="flex gap-2 items-center">
              <Input type="month" className="w-44" value={month} onChange={(e: any) => setMonth(e?.target?.value ?? '')} />
              <Button onClick={generate} disabled={busy}><Play className="h-4 w-4 mr-2" />{busy ? 'Generating...' : 'Generate'}</Button>
            </div>
          } />
        </FadeIn>

        <FadeIn delay={0.05}>
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Staff in run</p><p className="text-xl font-bold">{rows.length}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Net</p><p className="text-xl font-bold">{fmt(total)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Paid</p><p className="text-xl font-bold text-green-600">{fmt(paid)}</p></CardContent></Card>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : rows.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Banknote className="h-10 w-10 mx-auto mb-3 opacity-40" />No payroll for {month}. Click Generate to build it from salary rules and attendance.</CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Staff</TableHead><TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Allow.</TableHead><TableHead className="text-right">Bonus</TableHead>
                  <TableHead className="text-right">OT</TableHead><TableHead className="text-right">Deduct.</TableHead>
                  <TableHead className="text-right">Adv.</TableHead><TableHead className="text-right">Net</TableHead>
                  <TableHead>Days P/A</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rows.map((r: any) => (
                    <TableRow key={r?.id}>
                      <TableCell className="font-medium">{r?.staff?.name ?? ''}<p className="text-xs text-muted-foreground capitalize">{r?.staff?.salaryType?.replace('_', ' ') ?? ''}</p></TableCell>
                      <TableCell className="text-right">{fmt(r?.baseSalary)}</TableCell>
                      <TableCell className="text-right">{fmt(r?.allowances)}</TableCell>
                      <TableCell className="text-right">{fmt(r?.bonuses)}</TableCell>
                      <TableCell className="text-right">{fmt(r?.overtimeAmount)}</TableCell>
                      <TableCell className="text-right text-destructive">{fmt(r?.deductions)}</TableCell>
                      <TableCell className="text-right">{fmt(r?.advances)}</TableCell>
                      <TableCell className="text-right font-bold">{fmt(r?.netSalary)}</TableCell>
                      <TableCell className="text-xs">{r?.presentDays}/{r?.absentDays}</TableCell>
                      <TableCell>{r?.status === 'paid' ? <Badge variant="outline">Paid</Badge> : r?.status === 'approved' ? <Badge variant="secondary">Approved</Badge> : <Badge variant="secondary">Draft</Badge>}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {r?.status !== 'paid' && <>
                          <Button size="sm" variant="ghost" onClick={() => { setEdit(r); setEditForm({ allowances: String(r?.allowances ?? 0), bonuses: String(r?.bonuses ?? 0), advances: String(r?.advances ?? 0) }); }}>Edit</Button>
                          <Button size="sm" variant="secondary" onClick={() => { setEditForm({ allowances: String(r?.allowances ?? 0), bonuses: String(r?.bonuses ?? 0), advances: String(r?.advances ?? 0) }); save(r.id, { status: 'paid', paymentMethod: 'cash' }); }}>Mark Paid</Button>
                        </>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </FadeIn>

        <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Adjust — {edit?.staff?.name}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (edit) save(edit.id); }} className="space-y-4">
              <div className="space-y-2"><Label>Allowances (Rs.)</Label><Input type="number" step="0.01" value={editForm.allowances} onChange={(e: any) => setEditForm((p) => ({ ...p, allowances: e?.target?.value ?? '' }))} /></div>
              <div className="space-y-2"><Label>Bonuses (Rs.)</Label><Input type="number" step="0.01" value={editForm.bonuses} onChange={(e: any) => setEditForm((p) => ({ ...p, bonuses: e?.target?.value ?? '' }))} /></div>
              <div className="space-y-2"><Label>Advances (Rs.)</Label><Input type="number" step="0.01" value={editForm.advances} onChange={(e: any) => setEditForm((p) => ({ ...p, advances: e?.target?.value ?? '' }))} /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ClinicLayout>
  );
}
