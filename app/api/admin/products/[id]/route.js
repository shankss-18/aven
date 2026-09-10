import db from "@/lib/db";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const GET = withAdminAuth(async (request, { params }) => {
  const { id } = await params;

  const productResult = await db.execute({
    sql: "SELECT * FROM products WHERE id = ?",
    args: [id],
  });

  const product = productResult.rows[0];
  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  const variantsResult = await db.execute({
    sql: "SELECT * FROM product_variants WHERE product_id = ?",
    args: [id],
  });

  return Response.json({ product, variants: variantsResult.rows });
});

export const PUT = withAdminAuth(async (request, { params }) => {
  const { id } = await params;
  const { name, description, category, basePrice, imageUrl } = await request.json();

  await db.execute({
    sql: `UPDATE products
          SET name = ?, description = ?, category = ?, base_price = ?, image_url = ?
          WHERE id = ?`,
    args: [name, description || null, category, basePrice, imageUrl || null, id],
  });

  return Response.json({ success: true });
});

export const DELETE = withAdminAuth(async (request, { params }) => {
  const { id } = await params;
  await db.execute({
    sql: "UPDATE products SET is_active = 0 WHERE id = ?",
    args: [id],
  });
  return Response.json({ success: true });
});