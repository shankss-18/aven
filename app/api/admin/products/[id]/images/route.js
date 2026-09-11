import db from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import { withAdminAuth } from "@/lib/withAdminAuth";

export const GET = withAdminAuth(async (request, { params }) => {
  const { id } = await params;
  const result = await db.execute({
    sql: "SELECT id, COALESCE(image_url, url) AS image_url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order",
    args: [id],
  });
  return Response.json({ images: result.rows });
});

export const POST = withAdminAuth(async (request, { params }) => {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const files = formData.getAll("images");

    if (!files || files.length === 0) {
      return Response.json({ error: "No images provided" }, { status: 400 });
    }

    const uploadedUrls = [];

    // Check if Cloudinary is configured with valid credentials (not placeholder asterisks)
    const hasValidCloudinary = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET &&
      !process.env.CLOUDINARY_API_SECRET.includes("*")
    );

    for (const file of files) {
      if (!file || typeof file === "string" || !file.size) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      let finalUrl = null;

      if (hasValidCloudinary) {
        try {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "aven-products" },
              (error, res) => (error ? reject(error) : resolve(res))
            );
            stream.end(buffer);
          });
          if (result?.secure_url) {
            finalUrl = result.secure_url;
          }
        } catch (cloudErr) {
          console.warn("Cloudinary upload failed, using database storage fallback:", cloudErr?.message || cloudErr);
        }
      }

      if (finalUrl) {
        // Cloudinary upload succeeded
        await db.execute({
          sql: "INSERT INTO product_images (product_id, url, image_url) VALUES (?, ?, ?)",
          args: [id, finalUrl, finalUrl],
        });
        uploadedUrls.push(finalUrl);
      } else {
        // Safe database storage fallback (works 100% on Vercel & serverless without EROFS errors)
        const mimeType = file.type || "image/jpeg";
        const base64Data = buffer.toString("base64");

        const insertResult = await db.execute({
          sql: "INSERT INTO product_images (product_id, url, image_url, data, mime_type) VALUES (?, '', '', ?, ?)",
          args: [id, base64Data, mimeType],
        });

        const imageId = insertResult.lastInsertRowid;
        finalUrl = `/api/images/${imageId}`;

        await db.execute({
          sql: "UPDATE product_images SET url = ?, image_url = ? WHERE id = ?",
          args: [finalUrl, finalUrl, imageId],
        });

        uploadedUrls.push(finalUrl);
      }
    }

    if (uploadedUrls.length === 0) {
      return Response.json({ error: "No valid image files were provided" }, { status: 400 });
    }

    const isCover = formData.get("isCover") === "true";

    // Set the primary thumbnail if explicitly requested or if product doesn't have one
    const productResult = await db.execute({
      sql: "SELECT image_url FROM products WHERE id = ?",
      args: [id],
    });
    if (isCover || (productResult.rows[0] && !productResult.rows[0].image_url)) {
      await db.execute({
        sql: "UPDATE products SET image_url = ? WHERE id = ?",
        args: [uploadedUrls[0], id],
      });
    }

    return Response.json({ urls: uploadedUrls }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/admin/products/[id]/images:", err);
    return Response.json({ error: err.message || "Failed to upload images" }, { status: 500 });
  }
});