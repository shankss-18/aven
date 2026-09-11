import db from "@/lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const cleanId = parseInt(id, 10);

    if (isNaN(cleanId)) {
      return new Response("Invalid image ID", { status: 400 });
    }

    const result = await db.execute({
      sql: "SELECT data, mime_type FROM product_images WHERE id = ?",
      args: [cleanId],
    });

    const row = result.rows[0];
    if (!row || !row.data) {
      return new Response("Image not found", { status: 404 });
    }

    const buffer = Buffer.from(row.data, "base64");
    const mimeType = row.mime_type || "image/jpeg";

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Error serving image /api/images/[id]:", err);
    return new Response("Internal server error", { status: 500 });
  }
}
