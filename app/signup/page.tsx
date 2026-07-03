'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Mail, Lock, User } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, clinicName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Signup failed');
        return;
      }
      await signIn('credentials', { email, password, redirect: true, callbackUrl: '/dashboard' });
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Heart className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-display tracking-tight">Create Account</CardTitle>
          <CardDescription>Join ClinicPro to start managing your clinic</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic / Medical Center Name</Label>
              <Input id="clinicName" placeholder="Chilaw Family Clinic" value={clinicName} onChange={(e: any) => setClinicName(e?.target?.value ?? '')} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Your Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" placeholder="Dr. John Smith" value={name} onChange={(e: any) => setName(e?.target?.value ?? '')} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@clinic.com" value={email} onChange={(e: any) => setEmail(e?.target?.value ?? '')} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="Min 6 characters" value={password} onChange={(e: any) => setPassword(e?.target?.value ?? '')} className="pl-10" minLength={6} required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
