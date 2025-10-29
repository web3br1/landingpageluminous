import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import crypto from "node:crypto";

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET || "";
  if (!secret)
    return NextResponse.json(
      { ok: false, error: "No secret configured" },
      { status: 500 },
    );

  try {
    const body = (await request.json()) as {
      tag: string;
      ts?: number;
      sig?: string;
    };
    const { tag, sig } = body || ({} as any);
    if (!tag || !sig)
      return NextResponse.json(
        { ok: false, error: "Missing tag or sig" },
        { status: 400 },
      );

    const hmac = crypto.createHmac("sha256", secret).update(tag).digest("hex");
    if (hmac !== sig)
      return NextResponse.json(
        { ok: false, error: "Invalid signature" },
        { status: 401 },
      );

    await revalidateTag(tag);
    return NextResponse.json({ ok: true, tag });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Bad request" },
      { status: 400 },
    );
  }
}
