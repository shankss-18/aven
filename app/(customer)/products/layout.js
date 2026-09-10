// Metadata for the products listing page
export const metadata = {
  title: "Shop All Sneakers & Footwear",
  description:
    "Browse the full AVEN collection — premium men's sneakers, Chelsea boots, high-tops, and more. Filter by size, style, and colour.",
  alternates: { canonical: "/products" },
  openGraph: {
    title: "Shop All Sneakers & Footwear | AVEN",
    description:
      "Browse the full AVEN collection — premium men's sneakers, Chelsea boots, high-tops, and more.",
    url: "/products",
  },
};

export default function ProductsLayout({ children }) {
  return children;
}
