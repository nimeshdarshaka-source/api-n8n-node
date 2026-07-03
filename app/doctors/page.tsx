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
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';
import { UserCog, Plus, Stethoscope, DollarSign, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', specialization: '', phone: '', consultRate: '' });
  const [saving, setSaving] = useState(false);

  const fetch_ = () => {
    setLoading(true);
    fetch('/api/doctors').then((r: any) => r?.json?.()).then((d: any) => setDoctors(d ?? [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { fetch_(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/doctors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); toast.error(d?.error ?? 'Failed'); return; }
      toast.success('Doctor added'); setOpen(false); setForm({ name: '', specialization: '', phone: '', consultRate: '' }); fetch_();
    } catch { toast.error('Error'); } finally { setSaving(false); }
  };

  const update = (f: string, v: string) => setForm((p: any) => ({ ...(p ?? {}), [f]: v }));

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Doctors" description="Manage clinic doctors and their consultation rates" actions={
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Doctor</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Doctor</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e: any) => update('name', e?.target?.value ?? '')} required /></div>
                  <div className="space-y-2"><Label>Specialization *</Label><Input value={form.specialization} onChange={(e: any) => update('specialization', e?.target?.value ?? '')} required /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e: any) => update('phone', e?.target?.value ?? '')} /></div>
                  <div className="space-y-2"><Label>Consultation Rate ($)</Label><Input type="number" step="0.01" value={form.consultRate} onChange={(e: any) => update('consultRate', e?.target?.value ?? '')} /></div>
                  <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Saving...' : 'Add Doctor'}</Button>
                </form>
              </DialogContent>
            </Dialog>
          } />
        </FadeIn>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map((i: number) => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}</div>
        ) : (doctors?.length ?? 0) === 0 ? (
          <Card><CardContent className="py-12 text-center"><UserCog className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No doctors added yet</p></CardContent></Card>
        ) : (
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors?.map?.((d: any) => (
              <StaggerItem key={d?.id}>
                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                          <Stethoscope className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium">Dr. {d?.name ?? 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{d?.specialization ?? 'General'}</p>
                        </div>
                      </div>
                      <Badge variant={d?.isActive ? 'default' : 'secondary'} className="text-xs">{d?.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{(d?.consultRate ?? 0)?.toFixed?.(2)}/visit</span>
                      {d?.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{d.phone}</span>}
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            )) ?? []}
          </Stagger>
        )}
      </div>
    </ClinicLayout>
  );
}
