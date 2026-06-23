import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const EDITOR_TOKEN = process.env.MMA_EDITOR_TOKEN || "mma-editor-v1";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("editor-token")?.value;

  if (token !== EDITOR_TOKEN) {
    const url = request.nextUrl.clone();
    const from = request.nextUrl.pathname;
    url.pathname = "/tools/unlock";
    url.searchParams.set("from", from);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/tools/pose-editor/:path*"],
};
