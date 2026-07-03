'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/animate';
import { ArrowLeft, User, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function PatientDetailPage() {
  const params = useParams();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/patients/${params.id}`)
      .then((r: any) => r?.json?.())
      .then((d: any) => setPatient(d ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) return <ClinicLayout><div className="p-6"><div className="h-48 bg-muted animate-pulse rounded-lg" /></div></ClinicLayout>;
  if (!patient) return <ClinicLayout><div className="p-6 text-center"><p className="text-muted-foreground">Patient not found</p></div></ClinicLayout>;

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1000px] mx-auto">
        <FadeIn>
          <div className="flex items-center gap-3">
            <Link href="/patients"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
            <PageHeader title={patient?.name ?? 'Patient'} description="Patient profile and visit history" />
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                  <div><p className="text-xs text-muted-foreground">Phone</p><p className="text-sm font-medium flex items-center gap-1"><Phone className="h-3 w-3" />{patient?.phone ?? 'N/A'}</p></div>
                  <div><p className="text-xs text-muted-foreground">Age / Gender</p><p className="text-sm font-medium">{patient?.age ?? 0} yrs • {patient?.gender ?? 'N/A'}</p></div>
                  <div><p className="text-xs text-muted-foreground">Address</p><p className="text-sm font-medium flex items-center gap-1"><MapPin className="h-3 w-3" />{patient?.address || 'N/A'}</p></div>
                </div>
              </div>
              {patient?.notes && <p className="mt-4 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{patient.notes}</p>}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.2}>
          <Card>
            <CardHeader><CardTitle className="text-lg font-display">Visit History ({(patient?.visits?.length ?? 0)} visits)</CardTitle></CardHeader>
            <CardContent>
              {(patient?.visits?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No visits yet</p>
              ) : (
                <div className="space-y-3">
                  {patient?.visits?.map?.((v: any) => (
                    <div key={v?.id} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{new Date(v?.visitDate ?? 0).toLocaleDateString()}</span>
                          <Badge variant={v?.status === 'completed' ? 'default' : 'secondary'} className="text-xs">{v?.status ?? 'pending'}</Badge>
                        </div>
                        <span className="text-sm font-mono font-bold flex items-center gap-1"><DollarSign className="h-3 w-3" />{(v?.totalAmount ?? 0)?.toFixed?.(2)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Dr. {v?.doctor?.name ?? 'Unknown'}</p>
                      {v?.diagnosis && <p className="text-xs mt-1">Dx: {v.diagnosis}</p>}
                      {(v?.services?.length ?? 0) > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {v?.services?.map?.((s: any) => <Badge key={s?.id} variant="outline" className="text-xs">{s?.service?.name ?? 'Service'}</Badge>)}
                        </div>
                      )}
                    </div>
                  )) ?? []}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </ClinicLayout>
  );
}
