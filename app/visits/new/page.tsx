'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FadeIn } from '@/components/ui/animate';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface ServiceLine {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
}

export default function NewVisitPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [servicesList, setServicesList] = useState<any[]>([]);
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [lines, setLines] = useState<ServiceLine[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/patients').then((r: any) => r?.json?.()),
      fetch('/api/doctors').then((r: any) => r?.json?.()),
      fetch('/api/services').then((r: any) => r?.json?.()),
    ]).then(([p, d, s]: any) => {
      setPatients(p ?? []);
      setDoctors((d ?? []).filter((doc: any) => doc?.isActive !== false));
      setServicesList((s ?? []).filter((sv: any) => sv?.isActive !== false));
    }).catch(() => {});
  }, []);

  const addLine = (serviceId: string) => {
    const svc = servicesList?.find?.((s: any) => s?.id === serviceId);
    if (!svc) return;
    setLines((prev: ServiceLine[]) => [...(prev ?? []), { serviceId: svc.id, serviceName: svc.name, quantity: 1, unitPrice: svc.price ?? 0 }]);
  };

  const removeLine = (idx: number) => setLines((prev: ServiceLine[]) => (prev ?? []).filter((_: any, i: number) => i !== idx));

  const updateLine = (idx: number, field: string, val: any) => {
    setLines((prev: ServiceLine[]) => (prev ?? []).map((l: ServiceLine, i: number) => i === idx ? { ...(l ?? {}), [field]: val } : l));
  };

  const total = (lines ?? []).reduce((s: number, l: ServiceLine) => s + ((l?.quantity ?? 0) * (l?.unitPrice ?? 0)), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !doctorId) { toast.error('Select patient and doctor'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/visits', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, doctorId, visitDate, diagnosis, notes, paymentMethod, services: lines }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d?.error ?? 'Failed'); return; }
      toast.success('Visit recorded successfully');
      router.replace('/visits');
    } catch { toast.error('Error'); } finally { setSaving(false); }
  };

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[900px] mx-auto">
        <FadeIn>
          <div className="flex items-center gap-3">
            <Link href="/visits"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <PageHeader title="New Visit" description="Record a new patient visit" />
          </div>
        </FadeIn>

        <form onSubmit={handleSubmit} className="space-y-6">
          <FadeIn delay={0.1}>
            <Card>
              <CardHeader><CardTitle className="text-base">Visit Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient *</Label>
                    <Select value={patientId} onValueChange={setPatientId}>
                      <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                      <SelectContent>
                        {patients?.map?.((p: any) => <SelectItem key={p?.id} value={p?.id ?? ''}>{p?.name ?? ''} - {p?.phone ?? ''}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Doctor *</Label>
                    <Select value={doctorId} onValueChange={setDoctorId}>
                      <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                      <SelectContent>
                        {doctors?.map?.((d: any) => <SelectItem key={d?.id} value={d?.id ?? ''}>Dr. {d?.name ?? ''} - {d?.specialization ?? ''}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Visit Date</Label><Input type="date" value={visitDate} onChange={(e: any) => setVisitDate(e?.target?.value ?? '')} /></div>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Diagnosis</Label><Input value={diagnosis} onChange={(e: any) => setDiagnosis(e?.target?.value ?? '')} placeholder="Patient diagnosis" /></div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={(e: any) => setNotes(e?.target?.value ?? '')} rows={2} placeholder="Additional notes" /></div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.2}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Services</CardTitle>
                  <Select onValueChange={addLine}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Add service..." /></SelectTrigger>
                    <SelectContent>
                      {servicesList?.map?.((s: any) => <SelectItem key={s?.id} value={s?.id ?? ''}>{s?.name ?? ''} - ${(s?.price ?? 0)?.toFixed?.(2)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {(lines?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No services added yet</p>
                ) : (
                  <div className="space-y-3">
                    {lines?.map?.((l: ServiceLine, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <span className="flex-1 text-sm font-medium">{l?.serviceName ?? ''}</span>
                        <Input type="number" min="1" value={l?.quantity ?? 1} onChange={(e: any) => updateLine(i, 'quantity', parseInt(e?.target?.value) || 1)} className="w-20" />
                        <span className="text-xs text-muted-foreground">×</span>
                        <Input type="number" step="0.01" value={l?.unitPrice ?? 0} onChange={(e: any) => updateLine(i, 'unitPrice', parseFloat(e?.target?.value) || 0)} className="w-24" />
                        <span className="font-mono text-sm w-20 text-right">${((l?.quantity ?? 0) * (l?.unitPrice ?? 0))?.toFixed?.(2)}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    )) ?? []}
                    <div className="flex justify-end pt-3 border-t">
                      <p className="text-lg font-bold font-mono">Total: ${total?.toFixed?.(2) ?? '0.00'}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} size="lg"><Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Record Visit'}</Button>
            </div>
          </FadeIn>
        </form>
      </div>
    </ClinicLayout>
  );
}
