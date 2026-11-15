"use client";

import React from "react";

export default function Template({ children }) {
  return (
    <div className="w-full flex-1 flex flex-col transition-opacity duration-150 ease-out">
      {children}
    </div>
  );
}
