import { jsonResponse } from "../../functions/_lib/http";
import { onRequestOptions, onRequestPost } from "../../functions/api/job-photos/sign-upload";

export const config = {
  runtime: "edge",
};

export default function handler(request: Request) {
  if (request.method === "OPTIONS") return onRequestOptions();
  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  return onRequestPost({
    request,
    env: process.env,
    params: {},
  });
}
