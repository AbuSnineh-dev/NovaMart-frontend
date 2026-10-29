import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const origin = req.headers.get("origin");
  if (!["GET", "HEAD"].includes(req.method) && origin) {
    let sameOrigin = false;
    try {
      sameOrigin = new URL(origin).host === req.headers.get("host");
    } catch {}
    if (!sameOrigin)
      return NextResponse.json(
        { message: "Cross-origin request rejected" },
        { status: 403 },
      );
  }
  const { path } = await params;
  const portal =
    path.length === 2 && path[0] === "auth"
      ? path[1] === "admin-login"
        ? "admin"
        : path[1] === "customer-login"
          ? "user"
          : null
      : null;
  if (portal && req.method !== "POST")
    return NextResponse.json(
      { message: "Method not allowed" },
      { status: 405 },
    );
  const upstreamPath = portal ? ["auth", "Login"] : path;
  const allowed = [
    "auth",
    "products",
    "categories",
    "cart",
    "orders",
    "admin",
    "user",
  ];
  if (!allowed.includes(path[0]))
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  const base = (
    process.env.BACKEND_URL || "http://127.0.0.1:3000/api/v1"
  ).replace(/\/$/, "");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = req.cookies.get("nova_session")?.value;
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const upstream = await fetch(
      `${base}/${upstreamPath.map(encodeURIComponent).join("/")}${req.nextUrl.search}`,
      {
        method: req.method,
        headers,
        body: ["GET", "HEAD"].includes(req.method)
          ? undefined
          : await req.text(),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );
    const data = await upstream
      .json()
      .catch(() => ({ message: "Invalid API response" }));
    if (portal && upstream.status === 401)
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    const login =
      !!portal || (path[0] === "auth" && path[1]?.toLowerCase() === "login");
    const accessToken = login && upstream.ok ? data.accToken : undefined;
    if (accessToken) delete data.accToken;
    if (portal && accessToken) {
      const profile = await fetch(`${base}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (!profile.ok)
        return NextResponse.json(
          {
            message:
              profile.status === 401
                ? "Invalid email or password."
                : "Unable to sign in. Please try again.",
          },
          { status: profile.status },
        );
      const account = await profile.json();
      if (account.role !== portal)
        return NextResponse.json(
          {
            message: "Invalid email or password.",
          },
          { status: 401 },
        );
    }
    const response = NextResponse.json(data, { status: upstream.status });
    if (accessToken)
      response.cookies.set("nova_session", accessToken, {
        httpOnly: true,
        secure: req.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: 7200,
      });
    if (upstream.status === 401) response.cookies.delete("nova_session");
    return response;
  } catch {
    return NextResponse.json(
      {
        message: "The store service is unavailable. Please try again shortly.",
      },
      { status: 503 },
    );
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
