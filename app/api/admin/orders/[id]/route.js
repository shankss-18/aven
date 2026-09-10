import db from "@/lib/db";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const GET = withAdminAuth(async(request, {params}) =>{
    const {id} = await params
    const orderResults = await db.execute({
        sql: `
      SELECT o.id, o.status, o.total_amount, o.shiprocket_awb, o.created_at,
             u.name AS customer_name, u.email AS customer_email,
             a.full_name, a.phone, a.line1, a.city, a.state, a.pincode
      FROM orders o
      JOIN users u ON o.user_id = u.id
      JOIN addresses a ON o.address_id = a.id
      WHERE o.id = ?
    `,
    args: [id],
    })

    const order = orderResults.rows[0]
    if(!order){
        return new Response("order not found", {status: 404})
    }

    const itemsResult = await db.execute({
    sql: `
      SELECT oi.quantity, oi.price_at_purchase, pv.size, pv.color, p.name
      FROM order_items oi
      JOIN product_variants pv ON oi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE oi.order_id = ?
    `,
    args: [id],
  });

  return Response.json({ order, items: itemsResult.rows });
});