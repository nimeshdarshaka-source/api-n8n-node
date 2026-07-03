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
import { Plus, UserCog } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (n: number) => `Rs. ${(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const empty = { name: '', role: 'staff', phone: '', pin: '', salaryType: 'monthly', baseSalary: '', dailyRate: '', perPatientRate: '', percentageRate: '', otHourlyRate: '', doctorId: '', shiftId: '' };

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [shiftForm, setShiftForm] = useState({ name: '', startTime: '08:30', endTime: '17:00', graceMinutes: '15' });

  const fetch_ = () => {
    setLoading(true);
    fetch('/api/staff').then((r: any) => r?.json?.()).then((d: any) => setStaff(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setLoading(false));
    fetch('/api/doctors').then((r: any) => r?.json?.()).then((d: any) => setDoctors(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/shifts').then((r: any) => r?.json?.()).then((d: any) => setShifts(Array.isArray(d) ? d : [])).catch(() => {});
  };
  useEffect(() => { fetch_(); }, []);

  const u = (f: string, v: string) => setForm((p: any) => ({ ...p, [f]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { toast.error(d?.error ?? 'Failed'); return; }
      toast.success('Staff member added'); setOpen(false); setForm(empty); fetch_();
    } catch { toast.error('Error'); } finally { setSaving(false); }
  };

  const submitShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(shiftForm) });
      const d = await res.json();
      if (!res.ok) { toast.error(d?.error ?? 'Failed'); return; }
      toast.success('Shift added'); setShiftOpen(false); fetch_();
    } catch { toast.error('Error'); }
  };

  const salaryDesc = (s: any) =>
    s?.salaryType === 'monthly' ? `${fmt(s?.baseSalary)}/mo`
    : s?.salaryType === 'daily' ? `${fmt(s?.dailyRate)}/day`
    : s?.salaryType === 'per_patient' ? `${fmt(s?.perPatientRate)}/patient`
    : `${s?.percentageRate ?? 0}% of revenue`;

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Staff" description="Employees, salary rules, shifts and attendance PINs" actions={
            <div className="flex gap-2">
              <Dialog open={shiftOpen} onOpenChange={setShiftOpen}>
                <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" />Shift</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Shift</DialogTitle></DialogHeader>
                  <form onSubmit={submitShift} className="space-y-4">
                    <div className="space-y-2"><Label>Name *</Label><Input value={shiftForm.name} onChange={(e: any) => setShiftForm((p) => ({ ...p, name: e?.target?.value ?? '' }))} required /></div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2"><Label>Start *</Label><Input type="time" value={shiftForm.startTime} onChange={(e: any) => setShiftForm((p) => ({ ...p, startTime: e?.target?.value ?? '' }))} required /></div>
                      <div className="space-y-2"><Label>End *</Label><Input type="time" value={shiftForm.endTime} onChange={(e: any) => setShiftForm((p) => ({ ...p, endTime: e?.target?.value ?? '' }))} required /></div>
                      <div className="space-y-2"><Label>Grace (min)</Label><Input type="number" value={shiftForm.graceMinutes} onChange={(e: any) => setShiftForm((p) => ({ ...p, graceMinutes: e?.target?.value ?? '' }))} /></div>
                    </div>
                    <Button type="submit" className="w-full">Add Shift</Button>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Staff</Button></DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Add Staff Member</DialogTitle></DialogHeader>
                  <form onSubmit={submit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e: any) => u('name', e?.target?.value ?? '')} required /></div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <select className="w-full border rounded-md p-2 bg-background text-sm" value={form.role} onChange={(e: any) => u('role', e?.target?.value ?? '')}>
                          <option value="staff">Staff</option><option value="doctor">Doctor</option><option value="nurse">Nurse</option>
                          <option value="pharmacist">Pharmacist</option><option value="reception">Reception</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e: any) => u('phone', e?.target?.value ?? '')} /></div>
                      <div className="space-y-2"><Label>Attendance PIN</Label><Input value={form.pin} onChange={(e: any) => u('pin', e?.target?.value ?? '')} placeholder="4-6 digits" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Shift</Label>
                        <select className="w-full border rounded-md p-2 bg-background text-sm" value={form.shiftId} onChange={(e: any) => u('shiftId', e?.target?.value ?? '')}>
                          <option value="">No shift</option>
                          {shifts.map((s: any) => <option key={s?.id} value={s?.id ?? ''}>{s?.name ?? ''} ({s?.startTime}-{s?.endTime})</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Linked Doctor (for per-patient/% pay)</Label>
                        <select className="w-full border rounded-md p-2 bg-background text-sm" value={form.doctorId} onChange={(e: any) => u('doctorId', e?.target?.value ?? '')}>
                          <option value="">None</option>
                          {doctors.map((d: any) => <option key={d?.id} value={d?.id ?? ''}>{d?.name ?? ''}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Salary Type</Label>
                      <select className="w-full border rounded-md p-2 bg-background text-sm" value={form.salaryType} onChange={(e: any) => u('salaryType', e?.target?.value ?? '')}>
                        <option value="monthly">Fixed monthly</option><option value="daily">Daily rate</option>
                        <option value="per_patient">Per patient (doctor)</option><option value="percentage">% of revenue (doctor)</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {form.salaryType === 'monthly' && <div className="space-y-2"><Label>Base Salary (Rs.)</Label><Input type="number" step="0.01" value={form.baseSalary} onChange={(e: any) => u('baseSalary', e?.target?.value ?? '')} /></div>}
                      {form.salaryType === 'daily' && <div className="space-y-2"><Label>Daily Rate (Rs.)</Label><Input type="number" step="0.01" value={form.dailyRate} onChange={(e: any) => u('dailyRate', e?.target?.value ?? '')} /></div>}
                      {form.salaryType === 'per_patient' && <div className="space-y-2"><Label>Per Patient (Rs.)</Label><Input type="number" step="0.01" value={form.perPatientRate} onChange={(e: any) => u('perPatientRate', e?.target?.value ?? '')} /></div>}
                      {form.salaryType === 'percentage' && <div className="space-y-2"><Label>Percentage (%)</Label><Input type="number" step="0.1" value={form.percentageRate} onChange={(e: any) => u('percentageRate', e?.target?.value ?? '')} /></div>}
                      <div className="space-y-2"><Label>OT Hourly Rate (Rs.)</Label><Input type="number" step="0.01" value={form.otHourlyRate} onChange={(e: any) => u('otHourlyRate', e?.target?.value ?? '')} /></div>
                    </div>
                    <Button type="submit" className="w-full" disabled={saving}>{saving ? 'Saving...' : 'Add Staff'}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          } />
        </FadeIn>
        <FadeIn delay={0.1}>
          {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : staff.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><UserCog className="h-10 w-10 mx-auto mb-3 opacity-40" />No staff yet. Add staff members to enable attendance and payroll.</CardContent></Card>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Shift</TableHead><TableHead>Salary Rule</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {staff.map((s: any) => (
                    <TableRow key={s?.id}>
                      <TableCell className="font-medium">{s?.name ?? ''}<p className="text-xs text-muted-foreground">{s?.phone ?? ''}</p></TableCell>
                      <TableCell className="capitalize">{s?.role ?? ''}</TableCell>
                      <TableCell>{s?.shift ? `${s.shift.name} (${s.shift.startTime}-${s.shift.endTime})` : '-'}</TableCell>
                      <TableCell>{salaryDesc(s)}</TableCell>
                      <TableCell>{s?.isActive ? <Badge variant="outline">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
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
