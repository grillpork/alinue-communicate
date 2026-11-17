"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateArtwork } from "../hooks/use-artworks";

export function ArtworkForm() {
  const create = useCreateArtwork();

  const form =
    useForm <
    CreateArtworkInput >
    {
      resolver: zodResolver(createArtworkSchema),
      defaultValues: {
        title: "",
        description: "",
      },
    };

  const onSubmit = (values) => {
    create.mutate(values, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        {...form.register("title")}
        placeholder="Artwork title"
        className="text-base"
      />

      {form.formState.errors.title && (
        <p>{form.formState.errors.title.message}</p>
      )}

      <textarea
        {...form.register("description")}
        placeholder="Description"
        className="text-base"
      />

      {form.formState.errors.description && (
        <p>{form.formState.errors.description.message}</p>
      )}

      <button type="submit" disabled={create.isPending}>
        {create.isPending ? "Saving..." : "Create Artwork"}
      </button>

      {create.isError && <p>{create.error.message}</p>}
    </form>
  );
}
