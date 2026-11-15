
import "server-only";

import { cookies } from "next/headers";
import { ApiError } from "./api-error";

const API_URL = process.env.API_URL;

export async function serverApi(path) {
  const cookieStore = await cookies();

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      "Server API request failed"
    );
  }

  return response.json();
}
