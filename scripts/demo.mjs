import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const backendPort = process.env.NOVA_BACKEND_PORT || "3000";
const frontendPort = process.env.NOVA_FRONTEND_PORT || "3001";
const backendUrl = `http://127.0.0.1:${backendPort}/api/v1`;
const frontendUrl = `http://127.0.0.1:${frontendPort}`;
// Isolated real MongoDB replica set. Existing databases are never touched.
const repl = await MongoMemoryReplSet.create({
  replSet: { count: 1 },
  binary: { version: "7.0.14" },
});
const uri = repl.getUri("novamart_demo");
await mongoose.connect(uri);
const db = mongoose.connection.db;
const cats = [
  "Cases",
  "Chargers",
  "Cables",
  "Audio",
  "Power banks",
  "Screen guards",
  "Mounts",
  "Watch bands",
];
const catIds = cats.map(() => new mongoose.Types.ObjectId());
await db.collection("categories").insertMany(
  cats.map((name, i) => ({
    _id: catIds[i],
    name,
    description: `NovaMart ${name.toLowerCase()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
);
const photos = [
  "19651f7a90c7abaaf25dbad319547d4a",
  "595b0f9e0999e89eae08f023cb24c16b",
  "9a3471fcfbeff4191afa2366d2419966",
  "21f2faab2a6822fc57110d3ee8f25a61",
  "0e9b5f375d487d214601487a6675e1d8",
  "cf40ae31e1f62e7cad34f8adfd8649fd",
  "cf40ae31e1f62e7cad34f8adfd8649fd",
  "bc284b6ccb94bfe5dbd036ec8d8ab761",
  "4dcd536547c0ee822cfc60c2bf5b65e8",
  "edb9d3e9d2b976c3f30fc145c308f563",
  "6d69e37fe5b91f5114e7b1a24ffde588",
  "86239b4eb3e69f29e68be781becd9745",
  "3d104c05e9d62ad479c487735b2a0938",
  "1efa28986784d1f47712eb8161dcb730",
  "c0c86c3ea4183b79d4c0444d3c34ee52",
];
const data = [
  ["Noir Armor Case", 0, 29, 40],
  ["Crimson Slim Case", 0, 24, 55],
  ["Clear Shield Case", 0, 19, 70],
  ["GaN Fast Charger 65W", 1, 45, 30],
  ["MagSafe Charging Pad", 1, 39, 22],
  ["Braided USB-C Cable 2m", 2, 18, 100],
  ["Lightning Cable Black", 2, 16, 4],
  ["Nova Buds Pro", 3, 89, 18],
  ["Crimson Buds Lite", 3, 59, 0],
  ["PowerBank 20000 mAh", 4, 54, 26],
  ["Slim PowerBank 10000 mAh", 4, 35, 3],
  ["Tempered Glass 2-Pack", 5, 14, 120],
  ["Magnetic Car Mount", 6, 26, 35],
  ["Alloy Desk Stand", 6, 32, 14],
  ["Milanese Watch Band", 7, 34, 20],
];
const descriptions = [
  "Shock-absorbing corners and a raised camera lip for everyday drops.",
  "Fast, cool charging in a compact body that fits any socket.",
  "Braided and tough, tested for thousands of bends.",
  "Clear sound, a pocket charging case and a secure fit.",
  "Keep your everyday essentials charged wherever you go.",
  "Edge-to-edge glass that keeps the screen like new.",
  "A firm grip for the car or the desk, placed with one hand.",
  "A woven steel strap that moves from desk to dinner.",
];
await db.collection("products").insertMany(
  data.map(([name, cat, price, stockQuantity], i) => ({
    name,
    categoryId: catIds[cat],
    price,
    stockQuantity,
    description: descriptions[cat],
    imageUrl: `${frontendUrl}/images/${photos[i]}.jpg`,
    isActive: true,
    createdAt: new Date(Date.now() - i * 1000),
    updatedAt: new Date(),
  })),
);
const Password = await bcrypt.hash("Nova12345", 12);
await db.collection("users").insertMany([
  { name: "Layla Hassan", email: "customer@nova.test", Password, role: "user" },
  { name: "Store Admin", email: "admin@nova.test", Password, role: "admin" },
]);
await mongoose.disconnect();
await mkdir(".demo", { recursive: true });
await writeFile(
  frontendPort === "3001"
    ? ".demo/runtime.json"
    : `.demo/runtime-${frontendPort}.json`,
  JSON.stringify({
    mongo: uri,
    backend: backendUrl,
    frontend: frontendUrl,
  }),
);
const backend = spawn(process.execPath, ["dist/main.js"], {
  cwd: resolve("backend"),
  env: {
    ...process.env,
    MONGO_URI: uri,
    JWT_SECRET: randomBytes(48).toString("hex"),
    PORT: backendPort,
  },
  stdio: "inherit",
});
async function waitFor(url, child) {
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null)
      throw new Error(`Service exited before becoming ready: ${url}`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Service did not become ready: ${url}`);
}
try {
  await waitFor(`${backendUrl}/categories`, backend);
} catch (error) {
  backend.kill();
  await repl.stop();
  throw error;
}
const frontend = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    process.argv.includes("--production") ? "start" : "dev",
    "-p",
    frontendPort,
  ],
  {
    env: { ...process.env, BACKEND_URL: backendUrl },
    stdio: "inherit",
  },
);
console.log(
  `\nBackend ready. Starting frontend at ${frontendUrl}\nCustomer: customer@nova.test / Nova12345\nAdmin: admin@nova.test / Nova12345\nDemo data resets when stopped.\n`,
);
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  backend.kill();
  frontend.kill();
  await repl.stop();
  process.exit(code);
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
backend.on("exit", (code) => {
  if (!stopping) stop(code || 1);
});
frontend.on("exit", (code) => {
  if (!stopping) stop(code || 1);
});
