import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@libsql/client";

// Read .env.local
const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
envContent.split("\n").forEach((l) => {
  const idx = l.indexOf("=");
  if (idx > 0) env[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
});

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const db = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log("Checking Cloudinary ping...");
  await new Promise((resolve, reject) => {
    cloudinary.api.ping((err, res) => {
      if (err) return reject(err);
      console.log("Cloudinary ping ok:", res.status);
      resolve(res);
    });
  });

  console.log("Fetching images with base64 data or /api/images URL...");
  const result = await db.execute(`
    SELECT id, product_id, url, image_url, mime_type, data
    FROM product_images
    WHERE (data IS NOT NULL AND data != '') OR url LIKE '/api/images/%'
    ORDER BY id ASC
  `);

  console.log(`Found ${result.rows.length} images to migrate.`);

  for (const row of result.rows) {
    console.log(`Migrating Image ID: ${row.id}, Product ID: ${row.product_id}...`);
    let buffer = null;

    if (row.data) {
      buffer = Buffer.from(row.data, "base64");
    } else {
      console.warn(`No base64 data for image ${row.id}, skipping.`);
      continue;
    }

    try {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "aven-products",
            public_id: `product_${row.product_id}_img_${row.id}`,
            resource_type: "auto",
          },
          (err, res) => (err ? reject(err) : resolve(res))
        );
        stream.end(buffer);
      });

      const secureUrl = uploadResult.secure_url;
      console.log(`Uploaded Image ${row.id} -> ${secureUrl}`);

      // Update product_images table: set url and image_url to Cloudinary URL, clear data string
      await db.execute({
        sql: `UPDATE product_images SET url = ?, image_url = ?, data = NULL WHERE id = ?`,
        args: [secureUrl, secureUrl, row.id],
      });

      // Update products table if this image was used as product cover image
      await db.execute({
        sql: `UPDATE products SET image_url = ? WHERE id = ? AND (image_url = ? OR image_url LIKE '/api/images/' || ?)`,
        args: [secureUrl, row.product_id, row.url, row.id],
      });

      console.log(`Updated database record for image ${row.id}.`);
    } catch (err) {
      console.error(`Failed to migrate image ${row.id}:`, err.message || err);
    }
  }

  // Also check if any products still point to /api/images/
  const productsResult = await db.execute(`
    SELECT id, image_url FROM products WHERE image_url LIKE '/api/images/%'
  `);
  for (const prod of productsResult.rows) {
    const firstImg = await db.execute({
      sql: `SELECT image_url FROM product_images WHERE product_id = ? AND image_url LIKE 'https://res.cloudinary.com/%' ORDER BY sort_order ASC, id ASC LIMIT 1`,
      args: [prod.id],
    });
    if (firstImg.rows[0]) {
      await db.execute({
        sql: `UPDATE products SET image_url = ? WHERE id = ?`,
        args: [firstImg.rows[0].image_url, prod.id],
      });
      console.log(`Updated product ${prod.id} cover image to ${firstImg.rows[0].image_url}`);
    }
  }

  console.log("Migration complete!");
}

migrate().catch(console.error);
