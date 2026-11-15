"use client";

import React from "react";
import { PostFeed } from "@/features/post";

const HomeHeader = () => {
  return (
    <div className="w-full">
      <PostFeed />
    </div>
  );
};

export default HomeHeader;
