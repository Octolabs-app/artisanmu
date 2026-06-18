"use client";

import { getBrowserSupabase, getBrowserSupabaseConfig } from "@/lib/supabase-browser";

type FunctionErrorPayload = {
  error?: string;
  message?: string;
  reason?: string;
};

export class ArtisanMuFunctionError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public reason?: string,
  ) {
    super(message);
  }
}

function functionUrl(name: string) {
  const config = getBrowserSupabaseConfig();

  if (!config) {
    throw new ArtisanMuFunctionError(
      500,
      "missing_supabase_config",
      "Artizan Moris services are not configured for this build.",
    );
  }

  return {
    url: `${config.url.replace(/\/$/, "")}/functions/v1/${name}`,
    publishableKey: config.publishableKey,
  };
}

async function parsePayload(response: Response) {
  try {
    return (await response.json()) as FunctionErrorPayload;
  } catch {
    return {} as FunctionErrorPayload;
  }
}

async function callFunction<T>(
  name: string,
  body: Record<string, unknown>,
  headers: Record<string, string>,
) {
  const endpoint = functionUrl(name);
  const response = await fetch(endpoint.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: endpoint.publishableKey,
      ...headers,
    },
    body: JSON.stringify(body),
  });
  const payload = await parsePayload(response);

  if (!response.ok) {
    throw new ArtisanMuFunctionError(
      response.status,
      payload.error || "function_error",
      payload.message || "Artizan Moris service request failed.",
      payload.reason,
    );
  }

  return payload as T;
}

export async function invokePublicFunction<T>(name: string, body: Record<string, unknown>) {
  return callFunction<T>(name, body, {});
}

export async function invokeUserFunction<T>(name: string, body: Record<string, unknown>) {
  const supabase = getBrowserSupabase();

  if (!supabase) {
    throw new ArtisanMuFunctionError(
      500,
      "missing_supabase_config",
      "Artizan Moris login is not configured for this build.",
    );
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new ArtisanMuFunctionError(401, "unauthorized", "Log in as an approved artisan first.");
  }

  return callFunction<T>(name, body, {
    Authorization: `Bearer ${session.access_token}`,
  });
}
