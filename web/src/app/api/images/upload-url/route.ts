import { NextResponse } from "next/server";
import { getSupabaseAdmin, getSupabaseBucket } from "@/lib/supabase/server";

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function extForContentType(contentType: string): string {
  if (contentType === "image/jpeg") return "jpg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "bin";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const contentType = typeof body.contentType === "string" ? body.contentType : "";
  const bytes = typeof body.bytes === "number" ? body.bytes : 0;
  const kind = typeof body.kind === "string" && body.kind.trim() ? body.kind.trim() : "recipes";

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return NextResponse.json(
      { error: `Unsupported contentType. Allowed: ${Array.from(ALLOWED_CONTENT_TYPES).join(", ")}` },
      { status: 400 },
    );
  }
  if (!Number.isFinite(bytes) || bytes <= 0 || bytes > MAX_BYTES) {
    return NextResponse.json({ error: `Invalid bytes (max ${MAX_BYTES})` }, { status: 400 });
  }

  // NOTE: This endpoint is intentionally minimal for demo. Before production,
  //       add auth/rate-limiting so random users can't upload unlimited images.
  const id = crypto.randomUUID();
  const ext = extForContentType(contentType);
  const path = `${kind}/${id}.${ext}`;

  const supabase = getSupabaseAdmin();
  const bucket = getSupabaseBucket();

  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Failed to create upload URL" }, { status: 500 });
  }

  const baseUrl = process.env.SUPABASE_URL!;
  const publicUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${path}`;

  return NextResponse.json({
    id,
    bucket,
    path,
    uploadUrl: data.signedUrl,
    token: data.token,
    publicUrl,
  });
}

