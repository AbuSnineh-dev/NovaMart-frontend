import { test, expect } from "@playwright/test";

test("role revocation applies to an already issued admin session", async ({
  playwright,
}) => {
  const baseURL = process.env.NOVA_TEST_BASE_URL || "http://127.0.0.1:3001";
  const admin = await playwright.request.newContext({ baseURL });
  const candidate = await playwright.request.newContext({ baseURL });
  try {
    await admin.post("/api/auth/Login", {
      data: { email: "admin@nova.test", Password: "Nova12345" },
    });
    const email = `role-qa-${Date.now()}@nova.test`;
    const registration = await candidate.post("/api/auth/Register", {
      data: { name: "Role QA", email, Password: "Nova12345" },
    });
    expect(registration.ok()).toBe(true);
    const { user } = await registration.json();
    expect(
      (
        await admin.patch(`/api/user/${user.id}/role`, {
          data: { role: "admin" },
        })
      ).ok(),
    ).toBe(true);
    expect(
      (
        await candidate.post("/api/auth/Login", {
          data: { email, Password: "Nova12345" },
        })
      ).ok(),
    ).toBe(true);
    expect((await candidate.get("/api/admin/orders")).status()).toBe(200);
    expect(
      (
        await admin.patch(`/api/user/${user.id}/role`, {
          data: { role: "user" },
        })
      ).ok(),
    ).toBe(true);
    expect((await candidate.get("/api/admin/orders")).status()).toBe(403);
    expect((await candidate.get("/api/user")).status()).toBe(403);
    expect((await candidate.get("/api/auth/me")).status()).toBe(200);
  } finally {
    await admin.dispose();
    await candidate.dispose();
  }
});

