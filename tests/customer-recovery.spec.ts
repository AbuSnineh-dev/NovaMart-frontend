import { test, expect } from "@playwright/test";

test("public pages do not advertise staff routes and direct staff routes remain protected", async ({
  page,
  request,
}) => {
  for (const path of [
    "/",
    "/login",
    "/shop",
    "/forgot-password",
    "/about",
    "/faq",
  ]) {
    await page.goto(path);
    await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  }
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Page not found." }),
  ).toBeVisible();
  await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  const response = await request.get("/admin/login");
  expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  await page.goto("/admin/login");
  await expect(
    page.getByRole("heading", { name: "Administrator sign-in." }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Forgot password?", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Create account", exact: true }),
  ).toHaveCount(0);
});

test("customer-only recovery form validates email and never claims a message was sent", async ({
  page,
}) => {
  const recoveryRequests: string[] = [];
  page.on("request", (req) => {
    if (req.method() === "POST" && /forgot|reset|recover/i.test(req.url()))
      recoveryRequests.push(req.url());
  });
  await page.goto("/login");
  await expect(
    page.getByRole("link", { name: "Forgot password?", exact: true }),
  ).toBeVisible();
  await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  await page.screenshot({
    path: "test-results/customer-login.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Forgot password?", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Log in", exact: true })
    .first()
    .click();
  await page
    .getByRole("link", { name: "Forgot password?", exact: true })
    .click();
  await expect(page).toHaveURL("/forgot-password");
  await expect(
    page.getByRole("heading", { name: "Forgot your password?" }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill("not-an-email");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Password recovery is not available yet." }),
  ).toHaveCount(0);
  await page.getByLabel("Email address").fill("qa@example.test");
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.locator(".recovery-notice")).toHaveText(
    "Password recovery is not available yet. Please try again later.",
  );
  expect(recoveryRequests).toEqual([]);
  await page.screenshot({
    path: "test-results/password-recovery.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator("header")
    .getByRole("button", { name: "العربية", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(
    page.getByRole("heading", { name: "نسيت كلمة المرور؟" }),
  ).toBeVisible();
  await expect(page.locator(".recovery-notice")).toContainText(
    "استعادة كلمة المرور غير متاحة حالياً",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/password-recovery-mobile-ar.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "العودة لتسجيل الدخول" }).click();
  await expect(page).toHaveURL("/login");
});

test("authenticated staff use the dashboard directly without public navigation links", async ({
  page,
}) => {
  const result = await page.request.post("/api/auth/admin-login", {
    data: { email: "admin@nova.test", Password: "Nova12345" },
  });
  expect(result.ok()).toBe(true);
  await page.goto("/shop");
  await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "The store, at a glance." }),
  ).toBeVisible();
  await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
});
