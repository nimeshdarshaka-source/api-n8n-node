'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FadeIn } from '@/components/ui/animate';
import { Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: session } = useSession() || {};
  const myRole = (session?.user as any)?.role ?? 'staff';
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });

  const fetch_ = () => {
    fetch('/api/users').then((r: any) => r?.json?.()).then((d: any) => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
    fetch('/api/audit').then((r: any) => r?.json?.()).then((d: any) => setLogs(Array.isArray(d) ? d : [])).catch(() => {});
  };
  useEffect(() => { fetch_(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { toast.error(d?.error ?? 'Failed'); return; }
    toast.success('Login created'); setOpen(false); setForm({ name: '', email: '', password: '', role: 'staff' }); fetch_();
  };

  const roleBadge = (r: string) =>
    r === 'owner' ? <Badge>Owner</Badge> : r === 'manager' ? <Badge variant="secondary">Manager</Badge> : <Badge variant="outline">Staff</Badge>;

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Settings" description="Team logins, roles and the audit trail" />
        </FadeIn>
        <FadeIn delay={0.05}>
          <Tabs defaultValue="team">
            <TabsList>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="audit">Audit Log</TabsTrigger>
            </TabsList>

            <TabsContent value="team">
              <div className="flex justify-end mb-3">
                {myRole === 'owner' && (
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add Login</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Create Team Login</DialogTitle></DialogHeader>
                      <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2"><Label>Name *</Label><Input value={form.name} onChange={(e: any) => setForm((p) => ({ ...p, name: e?.target?.value ?? '' }))} required /></div>
                        <div className="space-y-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e: any) => setForm((p) => ({ ...p, email: e?.target?.value ?? '' }))} required /></div>
                        <div className="space-y-2"><Label>Password * (min 8 chars)</Label><Input type="password" value={form.password} onChange={(e: any) => setForm((p) => ({ ...p, password: e?.target?.value ?? '' }))} required /></div>
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <select className="w-full border rounded-md p-2 bg-background text-sm" value={form.role} onChange={(e: any) => setForm((p) => ({ ...p, role: e?.target?.value ?? '' }))}>
                            <option value="staff">Staff — daily operations, no financial approvals</option>
                            <option value="manager">Manager — purchases, payments, payroll</option>
                          </select>
                        </div>
                        <Button type="submit" className="w-full">Create Login</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Since</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {users.map((u: any) => (
                      <TableRow key={u?.id}>
                        <TableCell className="font-medium">{u?.name ?? ''}</TableCell>
                        <TableCell>{u?.email ?? ''}</TableCell>
                        <TableCell>{roleBadge(u?.role ?? 'staff')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
              {myRole !== 'owner' && <p className="text-xs text-muted-foreground mt-2">Only the owner can add logins.</p>}
            </TabsContent>

            <TabsContent value="audit">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Every stock, money and payroll change is recorded here</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Who</TableHead><TableHead>Action</TableHead><TableHead>Where</TableHead><TableHead>Detail</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {logs.map((l: any) => (
                        <TableRow key={l?.id}>
                          <TableCell className="text-xs whitespace-nowrap">{l?.createdAt ? new Date(l.createdAt).toLocaleString() : ''}</TableCell>
                          <TableCell className="font-medium">{l?.userName ?? ''}</TableCell>
                          <TableCell className="capitalize">{l?.action ?? ''}</TableCell>
                          <TableCell className="text-xs">{l?.tableName ?? ''}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{l?.detail ?? ''}</TableCell>
                        </TableRow>
                      ))}
                      {logs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No audit entries yet (manager/owner only)</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </FadeIn>
      </div>
    </ClinicLayout>
  );
}
