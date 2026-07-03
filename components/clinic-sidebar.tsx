'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, UserCog, Stethoscope, CalendarCheck,
  Package, Receipt, LogOut, Heart, ChevronRight, Truck, FileText, CreditCard,
  ClipboardList, Users2, Banknote, Fingerprint, BarChart3, Settings, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients', label: 'Patients', icon: Users },
  { href: '/doctors', label: 'Doctors', icon: UserCog },
  { href: '/services', label: 'Services', icon: Stethoscope },
  { href: '/visits', label: 'Visits', icon: CalendarCheck },
  { href: '/inventory', label: 'Inventory', icon: Package },
  { href: '/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/purchases', label: 'Purchases', icon: FileText },
  { href: '/supplier-payments', label: 'Payments', icon: CreditCard },
  { href: '/prescriptions', label: 'Prescriptions', icon: ClipboardList },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/staff', label: 'Staff', icon: Users2 },
  { href: '/attendance', label: 'Attendance', icon: Fingerprint },
  { href: '/payroll', label: 'Payroll', icon: Banknote },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/billing', label: 'Billing', icon: Wallet },
];

export function ClinicSidebar() {
  const pathname = usePathname() ?? '';
  const { data: session } = useSession() || {};

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-2 py-3 mb-4">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
          <Heart className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display font-bold text-base tracking-tight">ClinicPro</h2>
          <p className="text-[10px] text-muted-foreground">Management System</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems?.map?.((item: any) => {
          const isActive = pathname === item?.href || pathname?.startsWith?.(`${item?.href}/`);
          return (
            <Link
              key={item?.href}
              href={item?.href ?? '#'}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-fast',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              {item?.icon && <item.icon className="h-4 w-4 flex-shrink-0" />}
              <span>{item?.label ?? ''}</span>
              {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
            </Link>
          );
        }) ?? []}
      </nav>
      <div className="border-t pt-4 mt-4 space-y-3">
        <div className="px-3">
          <p className="text-sm font-medium truncate">{session?.user?.name ?? 'Staff'}</p>
          <p className="text-xs text-muted-foreground truncate">{session?.user?.email ?? ''}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={() => signOut?.({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
