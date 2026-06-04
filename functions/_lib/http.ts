export type PagesEnv = Record<string, string | undefined>;

export type PagesContext<Params extends Record<string, string | undefined> = Record<string, string | undefined>> = {
  request: Request;
  env: PagesEnv;
  params: Params;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, content-type, x-artisan-id",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

export function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "invalid_json", "The request body must be valid JSON.");
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return jsonResponse({ error: error.code, message: error.message }, error.status);
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return jsonResponse({ error: "server_error", message }, 500);
}
