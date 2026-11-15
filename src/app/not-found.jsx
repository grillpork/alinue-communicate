import React from "react";
import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";
import Button from "@/components/ui/Button";

/**
 * NotFound Component (Next.js App Router)
 * แสดงผลเมื่อเรียกฟังก์ชัน notFound() หรือเข้า URL ที่ไม่มีอยู่จริง (404)
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] w-full flex-col items-center justify-center px-4 py-16 text-center">
      {/* 404 Icon / Badge */}
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-50 border border-gray-100 shadow-2xs text-gray-400">
        <FileQuestion className="h-10 w-10 text-gray-500 stroke-[1.5]" />
      </div>

      <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">
        404 Error
      </span>
      <h1 className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">
        ไม่พบหน้าที่คุณต้องการ
      </h1>
      <p className="mt-2 max-w-sm text-xs sm:text-sm text-gray-500 leading-relaxed">
        หน้าที่คุณกำลังพยายามเข้าถึงอาจถูกลบ ย้ายที่อยู่ หรือไม่มีอยู่ในระบบ Alinue
      </p>

      {/* Action Button */}
      <div className="mt-6">
        <Link href="/">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Home className="h-4 w-4" />}
          >
            กลับสู่หน้าแรก
          </Button>
        </Link>
      </div>
    </div>
  );
}
