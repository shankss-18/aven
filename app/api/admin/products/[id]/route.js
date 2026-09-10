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

  // Clean up active shopping carts and wishlists
  await db.execute({
    sql: `DELETE FROM cart_items WHERE variant_id IN (SELECT id FROM product_variants WHERE product_id = ?)`,
    args: [id],
  });
  await db.execute({
    sql: "DELETE FROM wishlist_items WHERE product_id = ?",
    args: [id],
  });

  // Check if any past orders reference this product's variants
  const orderCheck = await db.execute({
    sql: `SELECT oi.id FROM order_items oi
          JOIN product_variants pv ON oi.variant_id = pv.id
          WHERE pv.product_id = ? LIMIT 1`,
    args: [id],
  });

  if (orderCheck.rows && orderCheck.rows.length > 0) {
    // If in orders, soft delete to preserve order history
    await db.execute({
      sql: "UPDATE products SET is_active = 0 WHERE id = ?",
      args: [id],
    });
  } else {
    // Otherwise completely purge product, variants, and gallery images
    await db.execute({
      sql: "DELETE FROM product_images WHERE product_id = ?",
      args: [id],
    });
    await db.execute({
      sql: "DELETE FROM product_variants WHERE product_id = ?",
      args: [id],
    });
    await db.execute({
      sql: "DELETE FROM products WHERE id = ?",
      args: [id],
    });
  }

  return Response.json({ success: true });
});