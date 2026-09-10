import db from "@/lib/db";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const GET = withAdminAuth(async (request) =>{
    const result = await db.execute(`
    SELECT o.id, o.status, o.total_amount, o.shiprocket_awb, o.created_at,
           u.name AS customer_name, u.email AS customer_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `);
  return Response.json({orders: result.rows})
})