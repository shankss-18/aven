import db from "@/lib/db";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const GET = withAdminAuth(async () => {
  const revenueResult = await db.execute(`
    SELECT COUNT(*) as order_count, SUM(total_amount) as total_revenue
    FROM orders WHERE status IN ('paid', 'shipped', 'delivered')
  `);

  const statusBreakdown = await db.execute(`
    SELECT status, COUNT(*) as count FROM orders GROUP BY status
  `);

  const topProducts = await db.execute(`
    SELECT p.name, SUM(oi.quantity) as units_sold
    FROM order_items oi
    JOIN product_variants pv ON oi.variant_id = pv.id
    JOIN products p ON pv.product_id = p.id
    GROUP BY p.id
    ORDER BY units_sold DESC
    LIMIT 5
  `);

  const pendingCancellations = await db.execute(`
    SELECT COUNT(*) as count FROM orders WHERE cancellation_status = 'requested'
  `);

  return Response.json({
    orderCount: revenueResult.rows[0].order_count,
    totalRevenue: revenueResult.rows[0].total_revenue || 0,
    statusBreakdown: statusBreakdown.rows,
    topProducts: topProducts.rows,
    pendingCancellations: pendingCancellations.rows[0].count,
  });
});