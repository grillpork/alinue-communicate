import HomeHeader from "@/components/home/HomeHeader";
import { Suspense } from "react";

const page = () => {
  return (
    <Suspense>
      <HomeHeader />
    </Suspense>
  );
};

export default page;
