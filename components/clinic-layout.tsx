import { AppShell } from '@/components/layouts/app-shell';
import { ClinicSidebar } from '@/components/clinic-sidebar';

export function ClinicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell sidebar={<ClinicSidebar />}>
      {children}
    </AppShell>
  );
}
