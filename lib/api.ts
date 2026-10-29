export type Product = {
  _id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  isActive: boolean;
};
export type Category = { _id: string; name: string; description?: string };
export type User = {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phoneNumber?: string;
  age?: number;
};
export type Cart = { items: { productId: Product | null; quantity: number }[] };
export type Order = {
  _id: string;
  userId: string;
  items: { productId: string; name: string; price: number; quantity: number }[];
  totalAmount: number;
  status: string;
  createdAt: string;
};
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok)
    throw Object.assign(
      new Error(
        Array.isArray(data.message)
          ? data.message.join(" · ")
          : data.message || "Request failed",
      ),
      { status: res.status },
    );
  return data;
}
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n,
  );
export const transitions: Record<string, string[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
