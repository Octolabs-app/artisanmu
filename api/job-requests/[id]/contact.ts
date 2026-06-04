import { jsonResponse } from "../../../functions/_lib/http";
import { onRequestGet, onRequestOptions } from "../../../functions/api/job-requests/[id]/contact";

export const config = {
  runtime: "edge",
};

function jobIdFromUrl(url: string) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[2];
}

export default function handler(request: Request) {
  if (request.method === "OPTIONS") return onRequestOptions();
  if (request.method !== "GET") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  return onRequestGet({
    request,
    env: process.env,
    params: { id: jobIdFromUrl(request.url) },
  });
}
