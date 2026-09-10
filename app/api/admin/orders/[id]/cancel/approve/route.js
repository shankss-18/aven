import db from "@/lib/db";
import razorpay from "@/lib/razorpay";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const POST = withAdminAuth(async (request, { params }) => {
  const { id } = await params;

  const orderResult = await db.execute({
    sql: "SELECT id, status, cancellation_status, total_amount, razorpay_payment_id FROM orders WHERE id = ?",
    args: [id],
  });

  const order = orderResult.rows[0];
  if (!order) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.cancellation_status !== "requested") {
    return Response.json({ error: "No pending cancellation request for this order" }, { status: 409 });
  }

  // Real refund via Razorpay — this works in test mode too, no sandbox
  // limitation like Shiprocket has
  await razorpay.payments.refund(order.razorpay_payment_id, {
    amount: order.total_amount,
  });

  // Restore stock for every item in this order
  const itemsResult = await db.execute({
    sql: "SELECT variant_id, quantity FROM order_items WHERE order_id = ?",
    args: [id],
  });

  for (const item of itemsResult.rows) {
    await db.execute({
      sql: "UPDATE product_variants SET stock = stock + ? WHERE id = ?",
      args: [item.quantity, item.variant_id],
    });
  }

  await db.execute({
    sql: "UPDATE orders SET status = 'cancelled', cancellation_status = 'approved' WHERE id = ?",
    args: [id],
  });

  return Response.json({ success: true });
});