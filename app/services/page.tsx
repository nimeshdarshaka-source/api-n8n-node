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
import { Stethoscope, Plus, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Consultation', price: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetch_ = () => {
    setLoading(true);
    fetch('/api/services').then((r: any) => r?.json?.()).then((d: any) => setServices(d ?? [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetch_(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); toast.error(d?.error ?? 'Failed'); return; }
      toast.success('Service added'); setOpen(false); setForm({ name: '', category: 'Consultation', price: '', description: '' }); fetch_();
    } catch { toast.error('Error'); } finally { setSaving(false); }
  };

  const update = (f: string, v: string) => setForm((p: any) => ({ ...(p ?? {}), [f]: v }));

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Services" description="Manage clinic services and their pricing" actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Service</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Service</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e: any) => update('name', e?.target?.value ?? '')} required /></div>
                  <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e: any) => update('category', e?.target?.value ?? '')} /></div>
                  <div className="space-y-2"><Label>Price ($) *</Label><Input type="number" step="0.01" value={form.price} onChange={(e: any) => update('price', e?.target?.value ?? '')} required /></div>
                  <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={(e: any) => update('description', e?.target?.value ?? '')} /></div>
                  <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Saving...' : 'Add Service'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          } />
        </FadeIn>

        <FadeIn delay={0.1}>
          {loading ? (
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          ) : (services?.length ?? 0) === 0 ? (
            <Card><CardContent className="py-12 text-center"><Stethoscope className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No services added yet</p></CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services?.map?.((s: any) => (
                      <TableRow key={s?.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{s?.name ?? ''}</p>
                            {s?.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{s?.category ?? 'General'}</Badge></TableCell>
                        <TableCell className="font-mono">${(s?.price ?? 0)?.toFixed?.(2)}</TableCell>
                        <TableCell><Badge variant={s?.isActive ? 'default' : 'secondary'} className="text-xs">{s?.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
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
