import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function GET(req){
    const user = getUserFromRequest(req)
    if(!user){
        return Response.json({error : "Unauthorized"}, {status: 401})
    }

     const result = await db.execute({
    sql: `
      SELECT ci.id, ci.quantity, ci.variant_id,
             pv.size, pv.color, pv.stock, pv.price_override,
             p.id AS product_id, p.name, p.image_url, p.base_price
      FROM cart_items ci
      JOIN product_variants pv ON ci.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE ci.user_id = ?
    `,
    args: [user.userId],
  });

  return Response.json({ items: result.rows });
}

export async function POST(req){
    const user = getUserFromRequest(req)
    if(!user){
        return Response.json({error : "Unauthorized"}, {status: 401})
    }
    const { variantId , quantity } = await req.json()
    if(!variantId || !quantity || quantity < 0){
        return Response.json({error : "variantID and valid quantity are required"}, {status: 400})
    }
    const variantResult = await db.execute({
        sql: "select stock from product_variants where id = ?",
        args: [variantId]
    })
    const variant = variantResult.rows[0]
    if(!variant || variant.stock <= 0){
        return Response.json({error : "Out of Stock"}, {status: 409})
    }
    const existing = await db.execute({
        sql: "select id, quantity from cart_items where user_id = ? and variant_id = ?",
        args: [user.userId, variantId]
    })

    if (existing.rows.length > 0) {
    const newQuantity = existing.rows[0].quantity + quantity;
    await db.execute({
      sql: "UPDATE cart_items SET quantity = ? WHERE id = ?",
      args: [newQuantity, existing.rows[0].id],
    });
  } else {
    await db.execute({
      sql: "INSERT INTO cart_items (user_id, variant_id, quantity) VALUES (?, ?, ?)",
      args: [user.userId, variantId, quantity],
    });
  }
  return Response.json({success : true}, {status: 201})
}