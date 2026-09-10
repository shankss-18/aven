import db from "@/lib/db";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const GET = withAdminAuth(async () => {
  const result = await db.execute(`
    SELECT o.id, o.total_amount, o.cancellation_reason, o.created_at,
           u.name AS customer_name, u.email AS customer_email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.cancellation_status = 'requested'
    ORDER BY o.created_at DESC
  `);

  return Response.json({ requests: result.rows });
});