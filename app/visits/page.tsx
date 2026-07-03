'use client';
import { useState, useEffect } from 'react';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FadeIn } from '@/components/ui/animate';
import { CalendarCheck, Plus, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function VisitsPage() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/visits').then((r: any) => r?.json?.()).then((d: any) => setVisits(d ?? [])).catch(() => toast.error('Failed')).finally(() => setLoading(false));
  }, []);

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader title="Visits" description="Track patient visits and payments" actions={
            <Link href="/visits/new"><Button><Plus className="h-4 w-4 mr-2" />New Visit</Button></Link>
          } />
        </FadeIn>
        <FadeIn delay={0.1}>
          {loading ? <div className="h-48 bg-muted animate-pulse rounded-lg" /> : (visits?.length ?? 0) === 0 ? (
            <Card><CardContent className="py-12 text-center"><CalendarCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No visits recorded yet</p></CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits?.map?.((v: any) => (
                      <TableRow key={v?.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="text-sm font-mono">{new Date(v?.visitDate ?? 0).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{v?.patient?.name ?? 'Unknown'}</TableCell>
                        <TableCell className="text-sm">Dr. {v?.doctor?.name ?? 'Unknown'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(v?.services ?? [])?.slice?.(0, 2)?.map?.((s: any) => <Badge key={s?.id} variant="outline" className="text-xs">{s?.service?.name ?? ''}</Badge>)}
                            {(v?.services?.length ?? 0) > 2 && <Badge variant="secondary" className="text-xs">+{(v?.services?.length ?? 0) - 2}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-medium">${(v?.totalAmount ?? 0)?.toFixed?.(2)}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs capitalize">{v?.paymentMethod ?? 'cash'}</Badge></TableCell>
                        <TableCell><Badge variant={v?.status === 'completed' ? 'default' : 'secondary'} className="text-xs">{v?.status ?? 'pending'}</Badge></TableCell>
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
