import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
});

export const config = {
  matcher: [
    '/dashboard/:path*', '/patients/:path*', '/doctors/:path*', '/services/:path*',
    '/visits/:path*', '/inventory/:path*', '/expenses/:path*', '/suppliers/:path*',
    '/purchases/:path*', '/supplier-payments/:path*', '/prescriptions/:path*',
    '/staff/:path*', '/attendance/:path*', '/payroll/:path*', '/reports/:path*',
    '/settings/:path*', '/billing/:path*',
  ],
};
