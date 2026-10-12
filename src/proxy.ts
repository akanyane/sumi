import { type NextRequest, NextResponse } from "next/server";

// Next fails with a 500 when it can't decode a dynamic segment, so reject malformed URLs up front
export function proxy(request: NextRequest) {
  try {
    decodeURIComponent(request.nextUrl.pathname);
  } catch {
    return new NextResponse("Bad Request", { status: 400 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/((?!_next/|favicon.ico|logo.png).*)",
};
