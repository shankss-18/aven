import db from "@/lib/db";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const POST = withAdminAuth(async (request, { params }) => {
  const { id } = await params;

  await db.execute({
    sql: "UPDATE orders SET cancellation_status = 'rejected' WHERE id = ?",
    args: [id],
  });

  return Response.json({ success: true });
});