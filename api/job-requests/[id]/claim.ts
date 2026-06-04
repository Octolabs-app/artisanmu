import { jsonResponse } from "../../../functions/_lib/http";
import { onRequestOptions, onRequestPost } from "../../../functions/api/job-requests/[id]/claim";

export const config = {
  runtime: "edge",
};

function jobIdFromUrl(url: string) {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[2];
}

export default function handler(request: Request) {
  if (request.method === "OPTIONS") return onRequestOptions();
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  return onRequestPost({
    request,
    env: process.env,
    params: { id: jobIdFromUrl(request.url) },
  });
}
