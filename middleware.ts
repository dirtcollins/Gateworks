import { NextResponse } from "next/server";

export function middleware() {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }

  return new NextResponse(
    "Admin UI is disabled in production until server-side Supabase Auth guards are implemented.",
    {
      status: 403,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-robots-tag": "noindex"
      }
    }
  );
}

export const config = {
  matcher: ["/admin/:path*"]
};
