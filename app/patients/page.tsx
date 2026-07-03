'use client';
import { useState, useEffect } from 'react';
import { ClinicLayout } from '@/components/clinic-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate';
import { Users, Plus, Search, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPatients = (q: string = '') => {
    setLoading(true);
    fetch(`/api/patients?search=${encodeURIComponent(q)}`)
      .then((r: any) => r?.json?.())
      .then((d: any) => setPatients(d ?? []))
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPatients(); }, []);

  const handleSearch = () => fetchPatients(search);

  return (
    <ClinicLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-[1200px] mx-auto">
        <FadeIn>
          <PageHeader
            title="Patients"
            description="Manage patient records and profiles"
            actions={
              <Link href="/patients/new">
                <Button><Plus className="h-4 w-4 mr-2" />New Patient</Button>
              </Link>
            }
          />
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or phone..." value={search} onChange={(e: any) => setSearch(e?.target?.value ?? '')} onKeyDown={(e: any) => e?.key === 'Enter' && handleSearch()} className="pl-10" />
            </div>
            <Button variant="secondary" onClick={handleSearch}>Search</Button>
          </div>
        </FadeIn>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i: number) => <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />)}
          </div>
        ) : (patients?.length ?? 0) === 0 ? (
          <Card><CardContent className="py-12 text-center"><Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" /><p className="text-muted-foreground">No patients found</p></CardContent></Card>
        ) : (
          <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients?.map?.((p: any) => (
              <StaggerItem key={p?.id}>
                <Link href={`/patients/${p?.id}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium group-hover:text-primary transition-colors">{p?.name ?? 'Unknown'}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <Phone className="h-3 w-3" /> {p?.phone ?? 'N/A'}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">{p?.gender ?? 'N/A'}</Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Age: {p?.age ?? 0}</span>
                        <span className="truncate">{p?.address ?? ''}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </StaggerItem>
            )) ?? []}
          </Stagger>
        )}
      </div>
    </ClinicLayout>
  );
}
