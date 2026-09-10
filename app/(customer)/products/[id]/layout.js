import db from "@/lib/db";

export async function generateMetadata({ params }) {
  const id = (await params).id;
  try {
    const product = await db.execute({
      sql: "SELECT name, description, image_url, base_price FROM products WHERE id = ?",
      args: [id],
    });
    const p = product.rows[0];
    if (!p) {
      return { title: "Product Not Found" };
    }
    const price = p.base_price ? `From ₹${(p.base_price / 100).toLocaleString("en-IN")}` : "";
    const description = p.description
      ? `${p.description.slice(0, 140)}…`
      : `${p.name} — premium footwear by AVEN. ${price}`;

    return {
      title: p.name,
      description,
      alternates: { canonical: `/products/${id}` },
      openGraph: {
        title: `${p.name} | AVEN`,
        description,
        url: `/products/${id}`,
        images: p.image_url ? [{ url: p.image_url, alt: p.name }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `${p.name} | AVEN`,
        description,
        images: p.image_url ? [p.image_url] : [],
      },
    };
  } catch {
    return { title: "AVEN Product" };
  }
}

export default function ProductDetailLayout({ children }) {
  return children;
}
