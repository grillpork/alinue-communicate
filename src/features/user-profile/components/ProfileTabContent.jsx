"use client";

import React from "react";
import {
  ShowcaseTab,
  ServicesTab,
  PostsTab,
  LikesTab,
  BookmarksTab,
} from "./tabs";

export function ProfileTabContent({
  activeTab,
  username,
  isSelf,
  currentUser,
  data,
  callbacks,
}) {
  return (
    <div className="mt-4 px-2 sm:px-0">
      {activeTab === "showcases" && (
        <ShowcaseTab
          showcases={data.showcases}
          isLoading={data.isShowcasesLoading}
          isSelf={isSelf}
          username={username}
          currentUser={currentUser}
          onOpenCreate={callbacks.onOpenCreateShowcase}
        />
      )}

      {activeTab === "services" && (
        <ServicesTab
          services={data.services}
          isLoading={data.isServicesLoading}
          isSelf={isSelf}
          username={username}
          currentUser={currentUser}
          onOpenCreate={callbacks.onOpenCreateService}
        />
      )}

      {activeTab === "posts" && (
        <PostsTab
          posts={data.posts}
          isLoading={data.isPostsLoading}
          isSelf={isSelf}
          username={username}
          onOpenCreate={callbacks.onOpenCreatePost}
          onEditPost={callbacks.onEditPost}
          onDeletePost={callbacks.onDeletePost}
        />
      )}

      {activeTab === "likes" && (
        <LikesTab
          likedPosts={data.likedPosts}
          isLoading={data.isLikedPostsLoading}
          isSelf={isSelf}
          username={username}
        />
      )}

      {activeTab === "bookmarks" && (
        <BookmarksTab
          bookmarkedPosts={data.bookmarkedPosts}
          isSelf={isSelf}
          username={username}
        />
      )}
    </div>
  );
}
