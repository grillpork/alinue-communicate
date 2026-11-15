import { PostFeed } from "@/features";
import { Suspense } from "react";

const page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostFeed />
    </Suspense>
  );
};

export default page;
