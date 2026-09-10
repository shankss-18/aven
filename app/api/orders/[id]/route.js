import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function GET(req, {params}) {
    const user = getUserFromRequest(req)
    if (!user) {
        return new Response("Unauthorized", { status: 401 })
    }
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const orderResult = await db.execute({
    sql: `
        SELECT o.id, o.status, o.total_amount, o.shiprocket_awb, o.created_at,
                o.cancellation_status, o.cancellation_reason,
                a.full_name, a.phone, a.line1, a.city, a.state, a.pincode
        FROM orders o
        JOIN addresses a ON o.address_id = a.id
        WHERE o.id = ? AND o.user_id = ?
    `,
    args: [id, user.userId],
    });

    const order = orderResult.rows[0]
    if (!order) {
        return Response.json({ error: "Order not found" }, { status: 404 })
    }
    
    const itemsResult = await db.execute({
        sql: `
      SELECT oi.quantity, oi.price_at_purchase,
             pv.size, pv.color, p.name, p.image_url
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE oi.order_id = ?
    `,  
    args: [id],
  });

  return Response.json({ order, items: itemsResult.rows });
}