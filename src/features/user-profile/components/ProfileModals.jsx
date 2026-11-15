"use client";

import React from "react";
import {
  PostFormModal,
  PostDetailModal,
} from "@/features/post";
import {
  ShowcaseModal,
  CreateShowcaseModal,
} from "@/features/showcase";
import {
  ServiceDetailModal,
  CreateServiceModal,
} from "@/features/service";
import { isContentOwner } from "../utils/profile-parser";

export function ProfileModals({
  modal,
  onCloseModal,
  onSubmitPost,
  detailModals,
  currentUser,
  isSelf,
}) {
  const isPostOpen =
    modal?.type === "create-post" || modal?.type === "edit-post";
  const editingPost = modal?.type === "edit-post" ? modal?.data : null;

  const {
    selectedShowcase,
    selectedService,
    selectedPost,
    onCloseDetail,
    onDeletePost,
  } = detailModals;

  return (
    <>
      {/* 1. Create Showcase Modal */}
      <CreateShowcaseModal
        isOpen={modal?.type === "create-showcase"}
        onClose={onCloseModal}
      />

      {/* 2. Create Service Modal */}
      <CreateServiceModal
        isOpen={modal?.type === "create-service"}
        onClose={onCloseModal}
      />

      {/* 3. Create / Edit Post Modal */}
      <PostFormModal
        isOpen={isPostOpen}
        isEdit={Boolean(editingPost)}
        initialPost={editingPost}
        onClose={onCloseModal}
        onSubmit={onSubmitPost}
      />

      {/* 4. Detail Modals (Driven by URL) */}
      {selectedShowcase && (
        <ShowcaseModal
          showcase={selectedShowcase}
          isOpen={Boolean(selectedShowcase)}
          onClose={onCloseDetail}
          currentUserId={currentUser?.id}
          isOwner={isSelf || isContentOwner(currentUser, selectedShowcase)}
        />
      )}

      {selectedService && (
        <ServiceDetailModal
          service={selectedService}
          isOpen={Boolean(selectedService)}
          onClose={onCloseDetail}
          currentUserId={currentUser?.id}
          isOwner={isSelf || isContentOwner(currentUser, selectedService)}
        />
      )}

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          isOpen={Boolean(selectedPost)}
          onClose={onCloseDetail}
          onDelete={onDeletePost}
        />
      )}
    </>
  );
}
