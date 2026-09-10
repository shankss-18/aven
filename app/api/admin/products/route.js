import db from "@/lib/db";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const GET = withAdminAuth(async () => {
  const result = await db.execute(`
    SELECT id, name, description, category, base_price, image_url, created_at
    FROM products
    ORDER BY created_at DESC
  `);

  return Response.json({ products: result.rows });
});

export const POST = withAdminAuth(async (request) => {
  const { name, description, category, basePrice, imageUrl } = await request.json();

  if (!name || !category || !basePrice) {
    return Response.json({ error: "name, category, and basePrice are required" }, { status: 400 });
  }

  const result = await db.execute({
    sql: `INSERT INTO products (name, description, category, base_price, image_url)
          VALUES (?, ?, ?, ?, ?)`,
    args: [name, description || null, category, basePrice, imageUrl || null],
  });

  return Response.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
});