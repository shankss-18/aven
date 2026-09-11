import db from "@/lib/db";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const DELETE = withAdminAuth(async (request, { params }) => {
  const { id, imageId } = await params;

  // Retrieve image URL before deleting
  const imgRes = await db.execute({
    sql: "SELECT url, image_url, product_id FROM product_images WHERE id = ?",
    args: [imageId],
  });
  const deletedUrl = imgRes.rows[0]?.image_url || imgRes.rows[0]?.url;
  const prodId = id || imgRes.rows[0]?.product_id;

  await db.execute({
    sql: "DELETE FROM product_images WHERE id = ?",
    args: [imageId],
  });

  // If deleted image was the cover photo, update product cover to next image or null
  if (deletedUrl && prodId) {
    const prodRes = await db.execute({
      sql: "SELECT image_url FROM products WHERE id = ?",
      args: [prodId],
    });
    if (prodRes.rows[0]?.image_url === deletedUrl) {
      const nextImgRes = await db.execute({
        sql: "SELECT COALESCE(image_url, url) AS image_url FROM product_images WHERE product_id = ? ORDER BY sort_order, id LIMIT 1",
        args: [prodId],
      });
      const nextCover = nextImgRes.rows[0]?.image_url || null;
      await db.execute({
        sql: "UPDATE products SET image_url = ? WHERE id = ?",
        args: [nextCover, prodId],
      });
    }
  }

  return Response.json({ success: true });
});