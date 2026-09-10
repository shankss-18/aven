import db from "@/lib/db";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const POST = withAdminAuth(async (request) => {
  try {
    const body = await request.json();
    const { productId, color, colorHex, priceOverride } = body;

    if (!productId || !color) {
      return Response.json({ error: "productId and color are required" }, { status: 400 });
    }

    // Handle batch sizes: e.g. sizes: ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"]
    if (Array.isArray(body.sizes) && body.sizes.length > 0) {
      const stock = parseInt(body.stock, 10) || 0;
      const createdIds = [];

      for (const size of body.sizes) {
        const existing = await db.execute({
          sql: "SELECT id FROM product_variants WHERE product_id = ? AND size = ? AND color = ?",
          args: [Number(productId), size, color],
        });

        if (existing.rows.length > 0) {
          await db.execute({
            sql: "UPDATE product_variants SET stock = ?, color_hex = ? WHERE id = ?",
            args: [stock, colorHex || null, existing.rows[0].id],
          });
          createdIds.push(existing.rows[0].id);
        } else {
          const result = await db.execute({
            sql: `INSERT INTO product_variants (product_id, size, color, color_hex, stock, price_override) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [
              Number(productId),
              size,
              color,
              colorHex || null,
              stock,
              priceOverride ? Math.round(parseFloat(priceOverride) * 100) : null,
            ],
          });
          createdIds.push(Number(result.lastInsertRowid));
        }
      }

      return Response.json({ ids: createdIds }, { status: 201 });
    }

    // Single variant creation
    const { size, stock } = body;
    if (!size) {
      return Response.json({ error: "size is required" }, { status: 400 });
    }

    const existing = await db.execute({
      sql: "SELECT id FROM product_variants WHERE product_id = ? AND size = ? AND color = ?",
      args: [Number(productId), size, color],
    });

    if (existing.rows.length > 0) {
      await db.execute({
        sql: "UPDATE product_variants SET stock = ?, color_hex = ?, price_override = ? WHERE id = ?",
        args: [
          parseInt(stock, 10) || 0,
          colorHex || null,
          priceOverride ? Math.round(parseFloat(priceOverride) * 100) : null,
          existing.rows[0].id
        ],
      });
      return Response.json({ id: existing.rows[0].id, updated: true }, { status: 200 });
    }

    const result = await db.execute({
      sql: `INSERT INTO product_variants (product_id, size, color, color_hex, stock, price_override) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        Number(productId),
        size,
        color,
        colorHex || null,
        parseInt(stock, 10) || 0,
        priceOverride ? Math.round(parseFloat(priceOverride) * 100) : null,
      ],
    });

    return Response.json({ id: Number(result.lastInsertRowid) }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/admin/variants:", err);
    return Response.json({ error: err.message || "Failed to save variants" }, { status: 500 });
  }
});