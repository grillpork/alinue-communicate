"use client";

import React from "react";

export function ProfileTabs({ tabs, activeTab, onChangeTab }) {
  return (
    <div className="sticky top-[53px] lg:top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 px-2 sm:px-0 transition-all">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              title={tab.label}
              aria-label={tab.label}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className="hidden sm:inline text-[11px] text-gray-400">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
