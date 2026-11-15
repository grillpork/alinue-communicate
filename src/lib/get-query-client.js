import "server-only";

import { QueryClient } from "@tanstack/react-query";
import { makeQueryClient } from "./query-client";

export function getServerQueryClient() {
  // สร้างใหม่ทุก Server Request
  return makeQueryClient();
}
