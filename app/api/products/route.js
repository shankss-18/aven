import db from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let sql = "SELECT id, name, description, category, base_price, image_url, created_at FROM products WHERE (is_active = 1 OR is_active IS NULL)";
  const args = [];

  if (category) {
    sql += " AND category = ?";
    args.push(category);
  }
  sql += " ORDER BY created_at DESC";

  const productsResult = await db.execute({ sql, args });

  // Fetch all variants to associate with products
  const variantsResult = await db.execute(
    "SELECT id, product_id, size, color, stock, price_override FROM product_variants"
  );

  const variantsByProductId = {};
  for (const v of variantsResult.rows) {
    if (!variantsByProductId[v.product_id]) {
      variantsByProductId[v.product_id] = [];
    }
    variantsByProductId[v.product_id].push(v);
  }

  const products = productsResult.rows.map((p) => {
    const variants = variantsByProductId[p.id] || [];
    const sizes = Array.from(new Set(variants.map((v) => v.size).filter(Boolean)));
    const colors = Array.from(new Set(variants.map((v) => v.color).filter(Boolean)));

    return {
      ...p,
      variants,
      sizes,
      colors,
    };
  });

  return Response.json({ products });
}