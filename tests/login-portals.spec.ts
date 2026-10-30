import { test, expect } from "@playwright/test";

test("login portals verify the account role before creating a session", async ({
  playwright,
}) => {
  const client = await playwright.request.newContext({
    baseURL: process.env.NOVA_TEST_BASE_URL || "http://127.0.0.1:3001",
  });
  try {
    const customer = { email: "customer@nova.test", Password: "Nova12345" };
    const admin = { email: "admin@nova.test", Password: "Nova12345" };
    expect(
      (await client.post("/api/auth/admin-login", { data: customer })).status(),
    ).toBe(401);
    expect((await client.get("/api/auth/me")).status()).toBe(401);
    expect(
      (await client.post("/api/auth/customer-login", { data: admin })).status(),
    ).toBe(401);
    expect((await client.get("/api/auth/me")).status()).toBe(401);
    const accepted = await client.post("/api/auth/admin-login", {
      data: admin,
    });
    expect(accepted.ok()).toBe(true);
    expect(await accepted.json()).not.toHaveProperty("accToken");
    expect((await client.get("/api/admin/orders")).status()).toBe(200);
    expect(
      (await client.post("/api/auth/customer-login", { data: admin })).status(),
    ).toBe(401);
    expect((await client.get("/api/admin/orders")).status()).toBe(200);
    await client.delete("/api/session");
    expect(
      (await client.post("/api/auth/customer-login", { data: customer })).ok(),
    ).toBe(true);
    expect((await client.get("/api/admin/orders")).status()).toBe(403);
  } finally {
    await client.dispose();
  }
});

test("separate admin login has no registration and keeps failed logins on the admin page", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await expect(page).toHaveURL("/admin/login");
  await expect(
    page.getByRole("heading", { name: "Administrator sign-in." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("Email address").fill("admin@nova.test");
  await page.getByLabel("Password", { exact: true }).fill("WrongPassword");
  await page
    .locator("form")
    .getByRole("button", { name: "Log in", exact: true })
    .click();
  await expect(page.locator(".error-banner")).toContainText(/invalid/i);
  await expect(page).toHaveURL("/admin/login");
  await page.getByLabel("Email address").fill("customer@nova.test");
  await page.getByLabel("Password", { exact: true }).fill("Nova12345");
  await page
    .locator("form")
    .getByRole("button", { name: "Log in", exact: true })
    .click();
  await expect(page.locator(".error-banner")).toContainText(
    "Invalid email or password.",
  );
  await page.screenshot({
    path: "test-results/admin-login.png",
    fullPage: true,
  });
  await page.getByLabel("Email address").fill("admin@nova.test");
  await page
    .locator("form")
    .getByRole("button", { name: "Log in", exact: true })
    .click();
  await expect(page).toHaveURL("/admin");
});

test("customer login rejects admin credentials and allows customer login", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("admin@nova.test");
  await page.getByLabel("Password", { exact: true }).fill("Nova12345");
  await page
    .locator("form")
    .getByRole("button", { name: "Log in", exact: true })
    .click();
  await expect(page.locator(".error-banner")).toContainText(
    "Invalid email or password.",
  );
  await expect(page).toHaveURL("/login");
  await page.getByLabel("Email address").fill("customer@nova.test");
  await page
    .locator("form")
    .getByRole("button", { name: "Log in", exact: true })
    .click();
  await expect(page).toHaveURL("/shop");
});
