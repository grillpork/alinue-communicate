import { NextResponse } from 'next/server';

/**
 * Next.js Middleware เพื่อจัดการ Authentication:
 * 1. ถ้ามี auth_token อยู่แล้ว และพยายามเข้าหน้า /sign-in หรือ /sign-up
 *    -> Redirect ไปหน้า Home (/) ทันที
 * 2. ถ้าเข้าหน้าที่ต้องใช้ Auth เช่น /settings
 *    และไม่มี auth_token -> Redirect ไปที่ /sign-in
 */
export function middleware(request) {
  const { pathname, search } = request.nextUrl;

  // ตรวจสอบ token จาก Cookie (ทั้ง auth_token และ token)
  const token =
    request.cookies.get('auth_token')?.value ||
    request.cookies.get('token')?.value;

  const isAuthPage = pathname === '/sign-in' || pathname === '/sign-up';
  const isProtectedPage = pathname.startsWith('/settings');

  // กรณีผู้ใช้ Login อยู่แล้ว (มี token ใน cookie) แต่พยายามเข้าหน้า Sign In / Sign Up
  // ข้อยกเว้น: ถ้าใน search query มี ?token= หรือ ?auth_token= (เพิ่ง callback กลับมาจาก OAuth)
  // ให้ปล่อยผ่านเพื่อให้อัปเดต token หรือ redirect จาก client ได้
  const hasUrlToken =
    request.nextUrl.searchParams.has('token') ||
    request.nextUrl.searchParams.has('auth_token');

  if (isAuthPage && token && !hasUrlToken) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // กรณีเข้าหน้าที่ต้อง Login แต่ไม่มี token
  if (isProtectedPage && !token) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname + search);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/sign-in',
    '/sign-up',
    '/settings/:path*',
  ],
};
