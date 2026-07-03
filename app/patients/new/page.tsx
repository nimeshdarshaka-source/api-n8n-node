'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FadeIn } from '@/components/ui/animate';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', age: '', gender: 'Male', address: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/patients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data?.error ?? 'Failed'); return; }
      toast.success('Patient registered successfully');
      router.replace(`/patients/${data?.id}`);
    } catch { toast.error('Something went wrong'); } finally { setSaving(false); }
  };

  const update = (field: string, value: string) => setForm((p: any) => ({ ...(p ?? {}), [field]: value }));

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[800px] mx-auto">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <Link href="/patients"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <PageHeader title="Register Patient" description="Add a new patient to the system" />
          </div>
        </FadeIn>
        <FadeIn delay={0.1}>
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Full Name *</Label><Input value={form.name} onChange={(e: any) => update('name', e?.target?.value ?? '')} required /></div>
                  <div className="space-y-2"><Label>Phone *</Label><Input value={form.phone} onChange={(e: any) => update('phone', e?.target?.value ?? '')} required /></div>
                  <div className="space-y-2"><Label>Age</Label><Input type="number" value={form.age} onChange={(e: any) => update('age', e?.target?.value ?? '')} /></div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={form.gender} onValueChange={(v: string) => update('gender', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Address</Label><Input value={form.address} onChange={(e: any) => update('address', e?.target?.value ?? '')} /></div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e: any) => update('notes', e?.target?.value ?? '')} rows={3} /></div>
                <div className="flex justify-end"><Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Patient'}</Button></div>
              </form>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </ClinicLayout>
  );
}
