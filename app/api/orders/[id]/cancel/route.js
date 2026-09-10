import db from "@/lib/db";
import { getUserFromRequest } from "@/lib/getUserFromRequest";

export async function POST(request, { params }) {
  const user = getUserFromRequest(request);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { reason } = await request.json();

  const orderResult = await db.execute({
    sql: "SELECT id, status, cancellation_status FROM orders WHERE id = ? AND user_id = ?",
    args: [id, user.userId],
  });

  const order = orderResult.rows[0];
  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "paid") {
    return Response.json(
      { error: `Cannot cancel an order that is already "${order.status}"` },
      { status: 409 }
    );
  }

  if (order.cancellation_status !== "none") {
    return Response.json({ error: "A cancellation request already exists for this order" }, { status: 409 });
  }

  await db.execute({
    sql: "UPDATE orders SET cancellation_status = 'requested', cancellation_reason = ? WHERE id = ?",
    args: [reason || null, id],
  });

  return Response.json({ success: true });
}