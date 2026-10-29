import { test, expect, Page } from "@playwright/test";
async function login(page: Page, admin = false) {
  await page.goto(admin ? "/admin/login" : "/login");
  await page
    .getByLabel("Email address")
    .fill(admin ? "admin@nova.test" : "customer@nova.test");
  await page.getByLabel("Password", { exact: true }).fill("Nova12345");
  await page
    .locator("form")
    .getByRole("button", { name: "Log in", exact: true })
    .click();
  await expect(page).toHaveURL(admin ? "/admin" : "/shop");
}
test("catalog, combined filters, detail, sold-out, and mobile RTL layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Dress your phone in black and red." }),
  ).toBeVisible();
  await expect(page.locator(".category-tile")).toHaveCount(8);
  await expect(page.locator(".hero img").first()).toBeVisible();
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.goto("/shop");
  await expect(page.locator(".product-card")).toHaveCount(8);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(7);
  await page
    .getByRole("searchbox", { name: "Search accessories" })
    .fill("Noir");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("heading", { name: "Noir Armor Case" }).click();
  await expect(page.locator(".detail-price")).toHaveText("$29.00");
  await page.goto("/shop");
  await page
    .getByRole("searchbox", { name: "Search accessories" })
    .fill("Crimson Buds");
  await expect(page.locator(".product-card .add-link")).toBeDisabled();
  await page
    .getByRole("searchbox", { name: "Search accessories" })
    .fill("nothing matches 123");
  await expect(
    page.getByRole("heading", { name: "Nothing matches." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .last()
    .click();
  await expect(page.locator(".product-card")).toHaveCount(8);
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator("header")
    .getByRole("button", { name: "العربية", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { name: "المجموعة." })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/catalog-mobile-rtl.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("real customer flow: login, cart persistence, quantity, checkout, history, profile, logout", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("searchbox", { name: "Search accessories" })
    .fill("Noir Armor");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Added to your cart");
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Noir Armor Case");
  await page.getByRole("button", { name: "Increase Noir Armor Case" }).click();
  await expect(page.locator(".drawer-footer strong")).toHaveText("$58.00");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  await expect(page.locator(".drawer-footer strong")).toHaveText("$58.00");
  await page.getByRole("link", { name: "Checkout", exact: true }).click();
  await expect(page).toHaveURL("/checkout");
  await page
    .getByRole("button", { name: "Confirm order", exact: true })
    .click();
  await expect(page).toHaveURL(/\/success\//);
  await page.getByRole("link", { name: "View my orders" }).click();
  await expect(page.locator(".order-card").first()).toContainText(
    "Noir Armor Case × 2",
  );
  await expect(page.locator(".order-card").first()).toContainText("$58.00");
  await page.getByRole("button", { name: "View details" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("PENDING");
  await page.keyboard.press("Escape");
  await page.goto("/account");
  await page.getByLabel("Phone", { exact: true }).fill("0790000000");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Profile updated");
  await page.reload();
  await expect(page.getByLabel("Phone", { exact: true })).toHaveValue(
    "0790000000",
  );
  await page.getByRole("button", { name: "Log out" }).click();
  await page.goto("/orders");
  await expect(
    page.getByRole("link", { name: "Log in to continue" }),
  ).toBeVisible();
});
test("registration, invalid credentials and unauthorized admin route", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("missing@nova.test");
  await page.getByLabel("Password", { exact: true }).fill("wrongPassword");
  await page
    .locator("form")
    .getByRole("button", { name: "Log in", exact: true })
    .click();
  await expect(page.locator(".error-banner")).toContainText(/invalid/i);
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Full name").fill("QA Customer");
  await page.getByLabel("Email address").fill(`qa${Date.now()}@nova.test`);
  await page.getByLabel("Password", { exact: true }).fill("Nova12345");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .last()
    .click();
  await expect(page).toHaveURL("/shop");
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Access restricted" }),
  ).toBeVisible();
});
test("admin inventory CRUD, category integrity, user role changes, order fulfillment", async ({
  page,
}) => {
  await login(page, true);
  await expect(
    page.getByRole("heading", { name: "The store, at a glance." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "categories", exact: true }).click();
  await page
    .getByRole("textbox", { name: "New category name" })
    .fill("QA Accessories");
  await page.getByRole("button", { name: "Add category", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Category QA Accessories", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "products", exact: true }).click();
  await page.getByRole("button", { name: "Add product", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill("QA Travel Case");
  await dialog
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "QA Accessories" });
  await dialog
    .getByLabel("Description")
    .fill("A product created by the integration QA workflow.");
  await dialog.getByLabel("Price ($)").fill("12.50");
  await dialog.getByLabel("Stock", { exact: true }).fill("5");
  await dialog.getByRole("button", { name: "Save product" }).click();
  await expect(dialog).not.toBeVisible();
  const row = page.getByRole("row").filter({ hasText: "QA Travel Case" });
  await expect(row).toContainText("$12.50");
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  await dialog.getByLabel("Stock", { exact: true }).fill("7");
  await dialog.getByRole("button", { name: "Save product" }).click();
  await expect(row).toContainText("7");
  await page.getByRole("button", { name: "categories", exact: true }).click();
  let category = page.locator(".category-edit").filter({
    has: page.getByRole("textbox", {
      name: "Category QA Accessories",
      exact: true,
    }),
  });
  await category.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.locator(".error-banner")).toContainText(/product/i);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "products", exact: true }).click();
  await row.getByRole("button", { name: "Deactivate" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(row).toHaveCount(0);
  await page.getByRole("button", { name: "categories", exact: true }).click();
  await category.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Category QA Accessories", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "users", exact: true }).click();
  const role = page
    .getByRole("combobox", { name: "Role for QA Customer" })
    .last();
  await role.selectOption("admin");
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(role).toHaveValue("admin");
  await role.selectOption("user");
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(role).toHaveValue("user");
  await page.getByRole("button", { name: "orders", exact: true }).click();
  await page
    .getByRole("button", { name: "PROCESSING", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.locator(".status.processing").first()).toBeVisible();
  await page.screenshot({
    path: "test-results/admin-orders.png",
    fullPage: true,
  });
});
test("API: auth cookie, ownership, quantity bounds, role protection and logout", async ({
  playwright,
}) => {
  const customer = await playwright.request.newContext({
    baseURL: process.env.NOVA_TEST_BASE_URL || "http://127.0.0.1:3001",
  });
  const guest = await playwright.request.newContext({
    baseURL: process.env.NOVA_TEST_BASE_URL || "http://127.0.0.1:3001",
  });
  expect((await guest.get("/api/cart")).status()).toBe(401);
  expect((await guest.get("/api/admin/orders")).status()).toBe(401);
  const login = await customer.post("/api/auth/Login", {
    data: { email: "customer@nova.test", Password: "Nova12345" },
  });
  expect(login.ok()).toBe(true);
  expect(await login.json()).not.toHaveProperty("accToken");
  const cookies = (await customer.storageState()).cookies;
  expect(cookies.find((c) => c.name === "nova_session")?.httpOnly).toBe(true);
  expect((await customer.get("/api/admin/orders")).status()).toBe(403);
  expect((await customer.get("/api/user")).status()).toBe(403);
  const list = await (await customer.get("/api/products?limit=100")).json();
  const p = list.data.find(
    (p: { stockQuantity: number }) => p.stockQuantity > 0,
  );
  expect(
    (
      await customer.post("/api/cart/items", {
        data: { productId: p._id, quantity: 0 },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await customer.post("/api/cart/items", {
        data: { productId: p._id, quantity: p.stockQuantity + 1 },
      })
    ).status(),
  ).toBe(400);
  expect((await customer.get("/api/products/not-an-id")).status()).toBe(400);
  await customer.delete("/api/cart");
  expect((await customer.post("/api/orders", { data: {} })).status()).toBe(400);
  await customer.delete("/api/session");
  expect((await customer.get("/api/auth/me")).status()).toBe(401);
  await customer.dispose();
  await guest.dispose();
});
test("wishlist persistence, cart removal, keyboard dismissal and mobile pages", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("searchbox", { name: "Search accessories" })
    .fill("Noir Armor");
  await page
    .getByRole("button", { name: "Save Noir Armor Case", exact: true })
    .click();
  await page.goto("/wishlist");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Added to your cart");
  await page.getByRole("button", { name: "Open cart", exact: true }).click();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Room for something good.",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Save Noir Armor Case", exact: true })
    .click();
  await expect(page.locator(".product-card")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const url of [
    "/",
    "/login",
    "/orders",
    "/account",
    "/about",
    "/faq",
    "/checkout",
  ]) {
    await page.goto(url);
    await expect(page.locator("header")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      url,
    ).toBe(true);
  }
});
test("API: transactional checkout, snapshot prices, ownership and cancellation stock restoration", async ({
  playwright,
}) => {
  const baseURL = process.env.NOVA_TEST_BASE_URL || "http://127.0.0.1:3001";
  const owner = await playwright.request.newContext({ baseURL }),
    other = await playwright.request.newContext({ baseURL }),
    admin = await playwright.request.newContext({ baseURL });
  const email = `transaction${Date.now()}@nova.test`;
  expect(
    (
      await owner.post("/api/auth/Register", {
        data: { name: "Transaction QA", email, Password: "Nova12345" },
      })
    ).ok(),
  ).toBe(true);
  await owner.post("/api/auth/Login", {
    data: { email, Password: "Nova12345" },
  });
  await other.post("/api/auth/Login", {
    data: { email: "customer@nova.test", Password: "Nova12345" },
  });
  await admin.post("/api/auth/Login", {
    data: { email: "admin@nova.test", Password: "Nova12345" },
  });
  const list = await (
    await owner.get("/api/products?search=Noir&limit=100")
  ).json();
  const p = list.data[0];
  const initialStock = p.stockQuantity;
  expect(
    (
      await owner.post("/api/cart/items", {
        data: { productId: p._id, quantity: 2 },
      })
    ).ok(),
  ).toBe(true);
  const placed = await owner.post("/api/orders", { data: {} });
  expect(placed.ok()).toBe(true);
  const order = await placed.json();
  expect(order.totalAmount).toBe(p.price * 2);
  expect(
    (await (await owner.get(`/api/products/${p._id}`)).json()).stockQuantity,
  ).toBe(initialStock - 2);
  expect((await (await owner.get("/api/cart")).json()).items).toEqual([]);
  expect((await other.get(`/api/orders/${order._id}`)).status()).toBe(404);
  await admin.patch(`/api/products/${p._id}`, {
    data: { price: p.price + 10 },
  });
  const snapshot = await (await owner.get(`/api/orders/${order._id}`)).json();
  expect(snapshot.items[0].price).toBe(p.price);
  expect(snapshot.totalAmount).toBe(p.price * 2);
  await admin.patch(`/api/products/${p._id}`, { data: { price: p.price } });
  expect(
    (
      await admin.patch(`/api/admin/orders/${order._id}/status`, {
        data: { status: "DELIVERED" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await admin.patch(`/api/admin/orders/${order._id}/status`, {
        data: { status: "CANCELLED" },
      })
    ).ok(),
  ).toBe(true);
  expect(
    (await (await owner.get(`/api/products/${p._id}`)).json()).stockQuantity,
  ).toBe(initialStock);
  expect(
    (
      await admin.patch(`/api/admin/orders/${order._id}/status`, {
        data: { status: "CANCELLED" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (await (await owner.get(`/api/products/${p._id}`)).json()).stockQuantity,
  ).toBe(initialStock);
  const page = await (await owner.get("/api/products?limit=2&page=2")).json();
  expect(page.data).toHaveLength(2);
  expect(page.page).toBe(2);
  expect((await owner.get("/api/products?limit=101")).status()).toBe(400);
  await owner.dispose();
  await other.dispose();
  await admin.dispose();
});

