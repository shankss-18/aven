import db from "@/lib/db";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const PUT = withAdminAuth(async (request, { params }) => {
  const { id } = await params;
  const { stock, priceOverride, colorHex, color } = await request.json();

  if (color) {
    await db.execute({
      sql: "UPDATE product_variants SET stock = ?, price_override = ?, color_hex = ?, color = ? WHERE id = ?",
      args: [stock, priceOverride ?? null, colorHex ?? null, color, id],
    });
  } else {
    await db.execute({
      sql: "UPDATE product_variants SET stock = ?, price_override = ?, color_hex = ? WHERE id = ?",
      args: [stock, priceOverride ?? null, colorHex ?? null, id],
    });
  }

  return Response.json({ success: true });
});

export const DELETE = withAdminAuth(async (request, { params }) => {
  const { id } = await params;
  await db.execute({
    sql: "DELETE FROM product_variants WHERE id = ?",
    args: [id],
  });
  return Response.json({ success: true });
});