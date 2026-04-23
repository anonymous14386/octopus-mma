import { NextRequest, NextResponse } from "next/server";

const EDITOR_PASSWORD = process.env.EDITOR_PASSWORD ?? "changeme";
const EDITOR_TOKEN    = "mma-editor-v1";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { password?: string };

  if (!body.password || body.password !== EDITOR_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("editor-token", EDITOR_TOKEN, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
