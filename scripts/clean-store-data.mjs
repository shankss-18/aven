import fs from "fs";
import { createClient } from "@libsql/client";

// Read .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((l) => {
  const idx = l.indexOf("=");
  if (idx > 0) env[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
});

const db = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

async function cleanStoreData() {
  console.log("Beginning safe cleanup of products, variants, product images, and orders...");

  // 1. Delete order items (references orders and variants)
  const resOrderItems = await db.execute("DELETE FROM order_items");
  console.log(`Deleted order_items (affected rows: ${resOrderItems.rowsAffected})`);

  // 2. Delete orders
  const resOrders = await db.execute("DELETE FROM orders");
  console.log(`Deleted orders (affected rows: ${resOrders.rowsAffected})`);

  // 3. Delete product variants (references products)
  const resVariants = await db.execute("DELETE FROM product_variants");
  console.log(`Deleted product_variants (affected rows: ${resVariants.rowsAffected})`);

  // 4. Delete product images (references products)
  const resImages = await db.execute("DELETE FROM product_images");
  console.log(`Deleted product_images (affected rows: ${resImages.rowsAffected})`);

  // 5. Delete products
  const resProducts = await db.execute("DELETE FROM products");
  console.log(`Deleted products (affected rows: ${resProducts.rowsAffected})`);

  // 6. Clean any orphaned cart or wishlist items if any
  try {
    await db.execute("DELETE FROM cart_items");
  } catch (e) {
    // ignore
  }
  try {
    await db.execute("DELETE FROM wishlist_items");
  } catch (e) {
    // ignore
  }

  // 7. Verify counts
  console.log("\n--- Verification Summary ---");
  const checkTables = [
    "products",
    "product_variants",
    "product_images",
    "orders",
    "order_items",
    "users",
    "admins",
    "addresses",
  ];

  for (const t of checkTables) {
    const r = await db.execute(`SELECT COUNT(*) as c FROM "${t}"`);
    console.log(`${t}: ${r.rows[0].c} records`);
  }

  console.log("\nCleanup successfully completed!");
}

cleanStoreData().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
