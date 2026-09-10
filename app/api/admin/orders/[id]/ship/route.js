import db from "@/lib/db";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const POST = withAdminAuth(async (request, { params }) => {
  const { id } = await params;

  const orderResult = await db.execute({
    sql: "SELECT id, status FROM orders WHERE id = ?",
    args: [id],
  });

  const order = orderResult.rows[0];
  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "paid") {
    return Response.json(
      { error: `Cannot ship an order with status "${order.status}"` },
      { status: 409 }
    );
  }

  const mockAwb = `MOCKAWB${Date.now().toString().slice(-8)}`;

  await db.execute({
    sql: "UPDATE orders SET status = 'shipped', shiprocket_awb = ? WHERE id = ?",
    args: [mockAwb, id],
  });

  return Response.json({ success: true, awb: mockAwb, status: "shipped" });
});