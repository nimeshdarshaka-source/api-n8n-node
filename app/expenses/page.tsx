'use client';
import { useState, useEffect } from 'react';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FadeIn } from '@/components/ui/animate';
import { Receipt, Plus, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Equipment', 'Maintenance', 'Supplies', 'Marketing', 'Insurance', 'Other'];

export default function ExpensesPage() {
  const [data, setData] = useState<{ expenses: any[]; total: number }>({ expenses: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'Utilities', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);

  const fetch_ = () => {
    setLoading(true);
    fetch('/api/expenses').then((r: any) => r?.json?.()).then((d: any) => setData(d ?? { expenses: [], total: 0 })).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetch_(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); toast.error(d?.error ?? 'Failed'); return; }
      toast.success('Expense recorded'); setOpen(false); setForm({ category: 'Utilities', amount: '', date: new Date().toISOString().split('T')[0], notes: '' }); fetch_();
    } catch { toast.error('Error'); } finally { setSaving(false); }
  };

  const update = (f: string, v: string) => setForm((p: any) => ({ ...(p ?? {}), [f]: v }));

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Expenses" description="Track and manage clinic expenses" actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Expense</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={form.category} onValueChange={(v: string) => update('category', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Amount ($) *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e: any) => update('amount', e?.target?.value ?? '')} required /></div>
                    <div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.date} onChange={(e: any) => update('date', e?.target?.value ?? '')} required /></div>
                  </div>
                  <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={(e: any) => update('notes', e?.target?.value ?? '')} placeholder="Optional description" /></div>
                  <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Saving...' : 'Record Expense'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          } />
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40"><DollarSign className="h-5 w-5 text-rose-500" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold font-mono">${(data?.total ?? 0)?.toFixed?.(2) ?? '0.00'}</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : (data?.expenses?.length ?? 0) === 0 ? (
            <Card><CardContent className="py-12 text-center"><Receipt className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No expenses recorded yet</p></CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.expenses?.map?.((ex: any) => (
                      <TableRow key={ex?.id}>
                        <TableCell className="text-sm font-mono">{new Date(ex?.date ?? 0).toLocaleDateString()}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{ex?.category ?? 'Other'}</Badge></TableCell>
                        <TableCell className="font-mono font-medium">${(ex?.amount ?? 0)?.toFixed?.(2)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ex?.notes ?? ''}</TableCell>
                      </TableRow>
                    )) ?? []}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </FadeIn>
      </div>
    </ClinicLayout>
  );
}
