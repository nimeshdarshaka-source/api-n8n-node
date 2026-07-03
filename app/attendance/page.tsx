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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FadeIn } from '@/components/ui/animate';
import { Plus, LogIn, LogOut } from 'lucide-react';
import { toast } from 'sonner';

const t = (x: any) => (x ? new Date(x).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-');
const d = (x: any) => (x ? new Date(x).toLocaleDateString() : '-');

export default function AttendancePage() {
  const [data, setData] = useState<any>({ logs: [], staff: [] });
  const [leaves, setLeaves] = useState<any[]>([]);
  const [ot, setOt] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [pinOpen, setPinOpen] = useState<{ staffId: string; action: 'in' | 'out'; name: string } | null>(null);
  const [pin, setPin] = useState('');
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [otOpen, setOtOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ staffId: '', fromDate: '', toDate: '', leaveType: 'casual', reason: '' });
  const [otForm, setOtForm] = useState({ staffId: '', date: new Date().toISOString().slice(0, 10), hours: '', rate: '', approved: true, notes: '' });

  const fetch_ = () => {
    setLoading(true);
    fetch(`/api/attendance?date=${date}`).then((r: any) => r?.json?.()).then((x: any) => setData(x?.error ? { logs: [], staff: [] } : x)).catch(() => {}).finally(() => setLoading(false));
    fetch('/api/leaves').then((r: any) => r?.json?.()).then((x: any) => setLeaves(Array.isArray(x) ? x : [])).catch(() => {});
    fetch('/api/overtime').then((r: any) => r?.json?.()).then((x: any) => setOt(Array.isArray(x) ? x : [])).catch(() => {});
  };
  useEffect(() => { fetch_(); }, [date]);

  const mark = async (staffId: string, action: 'in' | 'out', usePin?: string) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, action, method: usePin ? 'pin' : 'manual', pin: usePin }),
      });
      const x = await res.json();
      if (!res.ok) { toast.error(x?.error ?? 'Failed'); return; }
      toast.success(`Checked ${action}`); setPinOpen(null); setPin(''); fetch_();
    } catch { toast.error('Error'); }
  };

  const submitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/leaves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leaveForm) });
    const x = await res.json();
    if (!res.ok) { toast.error(x?.error ?? 'Failed'); return; }
    toast.success('Leave request created'); setLeaveOpen(false); fetch_();
  };

  const approveLeave = async (id: string, status: string) => {
    const res = await fetch(`/api/leaves/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) { toast.success(`Leave ${status}`); fetch_(); } else { const x = await res.json(); toast.error(x?.error ?? 'Failed'); }
  };

  const submitOt = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/overtime', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(otForm) });
    const x = await res.json();
    if (!res.ok) { toast.error(x?.error ?? 'Failed'); return; }
    toast.success('Overtime recorded'); setOtOpen(false); fetch_();
  };

  const logFor = (staffId: string) => (data?.logs ?? []).find((l: any) => l?.staffId === staffId);
  const statusBadge = (s: string) =>
    s === 'late' ? <Badge variant="secondary">Late</Badge>
    : s === 'leave' ? <Badge variant="outline">Leave</Badge>
    : s === 'present' ? <Badge className="bg-green-100 text-green-700 hover:bg-green-100" variant="secondary">Present</Badge>
    : <Badge variant="secondary">{s}</Badge>;

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Attendance" description="PIN or manual check-in/out, leave and overtime (facial scan can be added later — PIN is the required fallback)" actions={
            <Input type="date" className="w-40" value={date} onChange={(e: any) => setDate(e?.target?.value ?? '')} />
          } />
        </FadeIn>

        <FadeIn delay={0.05}>
          <Tabs defaultValue="today">
            <TabsList>
              <TabsTrigger value="today">Daily Log</TabsTrigger>
              <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
              <TabsTrigger value="ot">Overtime</TabsTrigger>
            </TabsList>

            <TabsContent value="today">
              {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : (
                <Card><CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Staff</TableHead><TableHead>Shift</TableHead><TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(data?.staff ?? []).map((s: any) => {
                        const log = logFor(s?.id);
                        return (
                          <TableRow key={s?.id}>
                            <TableCell className="font-medium">{s?.name ?? ''}<p className="text-xs text-muted-foreground capitalize">{s?.role ?? ''}</p></TableCell>
                            <TableCell>{s?.shift ? `${s.shift.startTime}-${s.shift.endTime}` : '-'}</TableCell>
                            <TableCell>{t(log?.checkIn)}</TableCell>
                            <TableCell>{t(log?.checkOut)}</TableCell>
                            <TableCell>{log ? statusBadge(log?.status) : <Badge variant="secondary">-</Badge>}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button size="sm" variant="secondary" onClick={() => (s?.pin ? setPinOpen({ staffId: s.id, action: 'in', name: s.name }) : mark(s.id, 'in'))}><LogIn className="h-3.5 w-3.5 mr-1" />In</Button>
                              <Button size="sm" variant="outline" onClick={() => (s?.pin ? setPinOpen({ staffId: s.id, action: 'out', name: s.name }) : mark(s.id, 'out'))}><LogOut className="h-3.5 w-3.5 mr-1" />Out</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {(data?.staff?.length ?? 0) === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Add staff members first (Staff page)</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent></Card>
              )}
            </TabsContent>

            <TabsContent value="leaves">
              <div className="flex justify-end mb-3">
                <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Leave Request</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
                    <form onSubmit={submitLeave} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Staff *</Label>
                        <select className="w-full border rounded-md p-2 bg-background text-sm" value={leaveForm.staffId} onChange={(e: any) => setLeaveForm((p) => ({ ...p, staffId: e?.target?.value ?? '' }))} required>
                          <option value="">Select...</option>
                          {(data?.staff ?? []).map((s: any) => <option key={s?.id} value={s?.id ?? ''}>{s?.name ?? ''}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>From *</Label><Input type="date" value={leaveForm.fromDate} onChange={(e: any) => setLeaveForm((p) => ({ ...p, fromDate: e?.target?.value ?? '' }))} required /></div>
                        <div className="space-y-2"><Label>To *</Label><Input type="date" value={leaveForm.toDate} onChange={(e: any) => setLeaveForm((p) => ({ ...p, toDate: e?.target?.value ?? '' }))} required /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <select className="w-full border rounded-md p-2 bg-background text-sm" value={leaveForm.leaveType} onChange={(e: any) => setLeaveForm((p) => ({ ...p, leaveType: e?.target?.value ?? '' }))}>
                            <option value="casual">Casual</option><option value="sick">Sick</option><option value="annual">Annual</option><option value="nopay">No-pay</option>
                          </select>
                        </div>
                        <div className="space-y-2"><Label>Reason</Label><Input value={leaveForm.reason} onChange={(e: any) => setLeaveForm((p) => ({ ...p, reason: e?.target?.value ?? '' }))} /></div>
                      </div>
                      <Button type="submit" className="w-full">Submit Request</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {leaves.map((l: any) => (
                      <TableRow key={l?.id}>
                        <TableCell className="font-medium">{l?.staff?.name ?? ''}</TableCell>
                        <TableCell>{d(l?.fromDate)}</TableCell><TableCell>{d(l?.toDate)}</TableCell>
                        <TableCell className="capitalize">{l?.leaveType ?? ''}</TableCell>
                        <TableCell>{l?.status === 'approved' ? <Badge variant="outline">Approved</Badge> : l?.status === 'rejected' ? <Badge variant="destructive">Rejected</Badge> : <Badge variant="secondary">Pending</Badge>}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {l?.status === 'pending' && <>
                            <Button size="sm" variant="secondary" onClick={() => approveLeave(l.id, 'approved')}>Approve</Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => approveLeave(l.id, 'rejected')}>Reject</Button>
                          </>}
                        </TableCell>
                      </TableRow>
                    ))}
                    {leaves.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No leave requests</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>

            <TabsContent value="ot">
              <div className="flex justify-end mb-3">
                <Dialog open={otOpen} onOpenChange={setOtOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Overtime</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Record Overtime</DialogTitle></DialogHeader>
                    <form onSubmit={submitOt} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Staff *</Label>
                        <select className="w-full border rounded-md p-2 bg-background text-sm" value={otForm.staffId} onChange={(e: any) => setOtForm((p) => ({ ...p, staffId: e?.target?.value ?? '' }))} required>
                          <option value="">Select...</option>
                          {(data?.staff ?? []).map((s: any) => <option key={s?.id} value={s?.id ?? ''}>{s?.name ?? ''}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2"><Label>Date *</Label><Input type="date" value={otForm.date} onChange={(e: any) => setOtForm((p) => ({ ...p, date: e?.target?.value ?? '' }))} required /></div>
                        <div className="space-y-2"><Label>Hours *</Label><Input type="number" step="0.5" value={otForm.hours} onChange={(e: any) => setOtForm((p) => ({ ...p, hours: e?.target?.value ?? '' }))} required /></div>
                        <div className="space-y-2"><Label>Rate (Rs./h)</Label><Input type="number" step="0.01" placeholder="staff default" value={otForm.rate} onChange={(e: any) => setOtForm((p) => ({ ...p, rate: e?.target?.value ?? '' }))} /></div>
                      </div>
                      <div className="space-y-2"><Label>Notes</Label><Input value={otForm.notes} onChange={(e: any) => setOtForm((p) => ({ ...p, notes: e?.target?.value ?? '' }))} /></div>
                      <Button type="submit" className="w-full">Record</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Hours</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Approved</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {ot.map((o: any) => (
                      <TableRow key={o?.id}>
                        <TableCell className="font-medium">{o?.staff?.name ?? ''}</TableCell>
                        <TableCell>{d(o?.date)}</TableCell>
                        <TableCell className="text-right">{o?.hours ?? 0}</TableCell>
                        <TableCell className="text-right">Rs. {(o?.rate ?? 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">Rs. {(o?.amount ?? 0).toFixed(2)}</TableCell>
                        <TableCell>{o?.approved ? <Badge variant="outline">Yes</Badge> : <Badge variant="secondary">No</Badge>}</TableCell>
                      </TableRow>
                    ))}
                    {ot.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No overtime records</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </FadeIn>

        <Dialog open={!!pinOpen} onOpenChange={(o) => !o && setPinOpen(null)}>
          <DialogContent className="max-w-xs">
            <DialogHeader><DialogTitle>Enter PIN — {pinOpen?.name}</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (pinOpen) mark(pinOpen.staffId, pinOpen.action, pin); }} className="space-y-4">
              <Input type="password" inputMode="numeric" autoFocus value={pin} onChange={(e: any) => setPin(e?.target?.value ?? '')} placeholder="PIN" />
              <Button type="submit" className="w-full">Check {pinOpen?.action === 'in' ? 'In' : 'Out'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ClinicLayout>
  );
}
