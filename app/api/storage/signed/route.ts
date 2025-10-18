import { NextResponse } from "next/server";
import { getSignedUrl } from "../../../../lib/storage";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bucket = url.searchParams.get("bucket");
  const path = url.searchParams.get("path");
  const expires = Number(url.searchParams.get("expires") || "3600");
  if (!bucket || !path)
    return NextResponse.json({ error: "missing params" }, { status: 400 });
  try {
    const signed = await getSignedUrl(bucket, path, expires);
    return NextResponse.json({ url: signed });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || String(e) },
      { status: 500 }
    );
  }
}
