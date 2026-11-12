'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useMeQuery } from '@/services/auth';

/**
 * Route /profile จะทำการ Redirect อัตโนมัติไปยัง Path /[username] ของผู้ใช้ปัจจุบัน
 */
export default function ProfileRedirectPage() {
  const router = useRouter();
  const { data: meData, isLoading } = useMeQuery();

  useEffect(() => {
    if (!isLoading) {
      if (meData?.user?.username) {
        router.replace(`/${meData.user.username}`);
      } else {
        router.replace('/sign-in');
      }
    }
  }, [isLoading, meData, router]);

  return (
    <div className="flex flex-col items-center justify-center py-32 text-gray-400">
      <Loader2 className="h-7 w-7 animate-spin text-gray-500 mb-2" />
      <p className="text-xs">Redirecting to your profile...</p>
    </div>
  );
}
