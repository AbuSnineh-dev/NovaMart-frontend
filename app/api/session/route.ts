import { NextResponse } from "next/server";
export async function DELETE() {
  const r = NextResponse.json({ message: "Logged out" });
  r.cookies.delete("nova_session");
  return r;
}
