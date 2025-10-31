import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { createHmac } from "node:crypto";
import {
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  HTTP_STATUS,
} from "../../../lib/architecture/api-handler";

// Schema for revalidate payload validation
const revalidatePayloadSchema = z.object({
  tag: z.string().min(1, "Tag is required"),
  ts: z.number().optional(),
  sig: z.string().min(1, "Signature is required"),
});

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET || "";
  if (!secret) {
    return createErrorResponse(
      "REVALIDATE_SECRET_MISSING",
      "No secret configured",
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  try {
    // Parse and validate request body
    const parseResult = await parseRequestBody(request, revalidatePayloadSchema);
    if (!parseResult.success) {
      return (parseResult as { success: false; error: NextResponse }).error;
    }

    const { tag, sig } = parseResult.data;

    // Verify HMAC signature
    const hmac = createHmac("sha256", secret).update(tag).digest("hex");
    if (hmac !== sig) {
      return createErrorResponse(
        "INVALID_SIGNATURE",
        "Invalid signature",
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    await revalidateTag(tag);
    return createSuccessResponse({ ok: true, tag });
  } catch (error) {
    return createErrorResponse(
      "REVALIDATE_ERROR",
      "Bad request",
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
}
