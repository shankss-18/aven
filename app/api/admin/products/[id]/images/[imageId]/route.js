import db from "@/lib/db";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const DELETE = withAdminAuth(async (request, { params }) => {
  const { imageId } = await params;
  await db.execute({
    sql: "DELETE FROM product_images WHERE id = ?",
    args: [imageId],
  });
  return Response.json({ success: true });
});