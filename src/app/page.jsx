import { Suspense } from "react";
import { PostFeed } from "@/features";
import { getPosts } from "@/features/post/api/post.client";
import { SkeletonCard } from "@/components/ui/skeleton";

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto py-4 px-3 sm:px-0">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export default function HomePage() {
  // เริ่มยิง Promise ดึงโพสต์ชุดแรกจาก Server โดยไม่บล็อกการเรนเดอร์ (Streaming Promise)
  const initialPostsPromise = getPosts().catch(() => null);

  return (
    <Suspense fallback={<FeedSkeleton />}>
      <PostFeed initialPostsPromise={initialPostsPromise} />
    </Suspense>
  );
}

