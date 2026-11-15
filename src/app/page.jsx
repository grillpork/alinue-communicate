import { PostFeed } from "@/features";
import { Suspense } from "react";

const page = () => {
  return (
    <Suspense>
     <PostFeed />
    </Suspense>
  );
};

export default page;
