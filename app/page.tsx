import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Database,
  HeartPulse,
  LineChart,
  LockKeyhole,
  PackageCheck,
  Pill,
  Stethoscope,
  UsersRound,
  WalletCards,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth-options';

const modules = [
  {
    title: 'Patient flow',
    text: 'Registration, visits, doctors, services and prescriptions in one clinical timeline.',
    icon: ClipboardList,
  },
  {
    title: 'Pharmacy stock',
    text: 'Batch-wise purchases, expiry tracking, supplier ledgers and dispensing control.',
    icon: Pill,
  },
  {
    title: 'Billing control',
    text: 'Cash, bank transfer and subscription billing with audit-friendly records.',
    icon: WalletCards,
  },
  {
    title: 'Staff payroll',
    text: 'Attendance, leave, overtime and monthly payroll for clinic teams.',
    icon: UsersRound,
  },
];

const stats = [
  ['Clinic ERP', 'Purpose-built'],
  ['MySQL', 'Hostinger ready'],
  ['24/7', 'Web access'],
];

const checks = [
  'Multi-user clinic workspaces',
  'Inventory and supplier accounting',
  'Daily reports and audit trail',
  'Mobile-friendly clinical desk',
];

const operations = [
  { title: 'Clinical desk', text: 'Patients, visits and doctors', icon: Stethoscope },
  { title: 'Stock ledger', text: 'Batches, suppliers and expiry', icon: PackageCheck },
  { title: 'Staff time', text: 'Attendance, leave and OT', icon: CalendarClock },
  { title: 'Reports', text: 'Daily money and inventory view', icon: LineChart },
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/dashboard');

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7fbff] text-slate-950">
      <header className="border-b border-sky-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-sky-600 text-white shadow-sm shadow-sky-200">
              <HeartPulse className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-display text-base font-bold tracking-normal text-slate-950 sm:text-lg">
              SLDOCPP Clinic ERP
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden text-slate-700 hover:bg-sky-50 hover:text-sky-800 sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="bg-sky-600 hover:bg-sky-700">
              <Link href="/signup">
                Start
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative border-b border-sky-100 bg-[linear-gradient(135deg,#eef8ff_0%,#ffffff_48%,#e7fbff_100%)]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:px-8 lg:py-14">
          <div className="min-w-0 max-w-2xl">
            <h1 className="font-display text-4xl font-black leading-[1.02] tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
              SLDOCPP Clinic ERP
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              A blue, fast clinic operating system for patients, visits, pharmacy stock, supplier payments,
              billing, attendance and payroll.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 bg-sky-600 px-5 hover:bg-sky-700">
                <Link href="/signup">
                  Create clinic workspace
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 border-sky-200 bg-white px-5 text-sky-900 hover:bg-sky-50">
                <Link href="/login">
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  Login
                </Link>
              </Button>
            </div>
            <dl className="mt-8 grid max-w-xl grid-cols-1 divide-y divide-sky-100 rounded-md border border-sky-100 bg-white shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {stats.map(([value, label]) => (
                <div key={label} className="px-3 py-4 sm:px-5">
                  <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</dt>
                  <dd className="mt-1 text-base font-black text-sky-800 sm:text-lg">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative min-w-0">
            <div className="absolute -left-4 top-6 hidden h-24 w-24 rounded-md border border-cyan-200 bg-cyan-100/60 lg:block" />
            <div className="relative overflow-hidden rounded-md border border-sky-200 bg-white p-2 shadow-xl shadow-sky-900/10">
              <Image
                src="/og-image.png"
                alt="ClinicPro dashboard preview"
                width={1200}
                height={630}
                priority
                className="h-auto w-full rounded-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:px-8 lg:py-14">
          <div>
            <h2 className="font-display text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
              Built for clinic operations
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The first screen is simple; the inside is operational. Doctors, reception, pharmacy and admin
              can work from the same database without spreadsheet drift.
            </p>
            <ul className="mt-6 space-y-3">
              {checks.map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {modules.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-md border border-sky-100 bg-[#f8fcff] p-5 shadow-sm">
                <Icon className="h-6 w-6 text-sky-700" aria-hidden="true" />
                <h3 className="mt-4 font-display text-lg font-bold tracking-normal text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-sky-100 bg-sky-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-9 sm:px-6 lg:grid-cols-4 lg:px-8">
          {operations.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-cyan-400 text-sky-950">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold tracking-normal">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-sky-100">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f7fbff]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
              Ready for sldocpp.com
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Deploy the full Next.js app on Hostinger Node.js hosting with MySQL, then point the domain to the app.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-sky-600 hover:bg-sky-700">
              <Link href="/signup">
                Open signup
                <Building2 className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-sky-200 bg-white text-sky-900 hover:bg-sky-50">
              <Link href="/login">
                Login dashboard
                <Activity className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-sky-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>SLDOCPP Clinic ERP</span>
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4 text-sky-700" aria-hidden="true" />
            Hostinger Node.js + MySQL ready
          </span>
        </div>
      </footer>
    </main>
  );
}
