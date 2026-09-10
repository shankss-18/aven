import Link from "next/link";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HomeBestSellers from "@/components/HomeBestSellers";
import db from "@/lib/db";

export const metadata = {
  title: "AVEN — Premium Sneakers & Footwear for Men",
  description:
    "Discover premium men's sneakers, Chelsea boots, and high-tops at AVEN. Considered footwear crafted with care, built to last.",
  alternates: { canonical: "/" },
};


// Shared SVG glyph for sneaker
function SneakerGlyph({ className = "w-[62%] stroke-[#0e0e0c] fill-none stroke-[1.3]" }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true">
      <path d="M3 34c0-4 3-6 7-8 6-3 10-8 14-13 3-3 6-4 9-3 1 3 0 6-2 8 6 1 11 4 14 9 2 3 3 6 1 9-2 2-6 3-11 3H10c-4 0-7-1-7-5z" />
      <path d="M14 20c3 1 6 1 9 0" />
      <path d="M20 15c2 2 5 3 8 3" />
      <path d="M8 30h30" />
    </svg>
  );
}

// Shared SVG glyph for boot
function BootGlyph({ className = "w-[62%] stroke-[#0e0e0c] fill-none stroke-[1.3]" }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true">
      <path d="M12 6v16l-6 6c-2 2-3 4-3 7 0 3 2 4 5 4h26c3 0 5-1 5-4 0-3-2-5-5-6l-10-4V6z" />
      <path d="M12 12h14" />
      <path d="M9 33h30" />
      <path d="M20 22l7 6" />
    </svg>
  );
}

const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: "Ridge Runner",
    category: "sneaker",
    sub: "Sneaker · White",
    price: 220,
    image_url: "/products/ridge-runner.jpg",
    glyph: "sneaker",
    tileBg: "bg-[#eae5d5]",
    isWishlisted: false,
  },
  {
    id: 2,
    name: "Fieldworker Boot",
    category: "boot",
    sub: "Boot · Chestnut",
    price: 340,
    image_url: "/products/highland-chelsea.jpg",
    glyph: "boot",
    tileBg: "bg-[#e3dfd0]",
    isWishlisted: false,
  },
  {
    id: 3,
    name: "Cascade Trail",
    category: "trainer",
    sub: "Trainer · Grey",
    price: 260,
    image_url: "/products/urban-trail.jpg",
    glyph: "sneaker",
    tileBg: "bg-[#dfe2dc]",
    isWishlisted: true,
  },
  {
    id: 4,
    name: "Waxed Derby Boot",
    category: "boot",
    sub: "Boot · Black",
    price: 420,
    image_url: "/products/stealth-court.jpg",
    glyph: "boot",
    tileBg: "bg-[#ece3d8]",
    isWishlisted: false,
  },
];

async function getProducts() {
  try {
    const result = await db.execute({
      sql: "SELECT id, name, description, category, base_price, image_url FROM products ORDER BY id ASC LIMIT 4",
      args: [],
    });

    if (result && result.rows && result.rows.length > 0) {
      return result.rows.map((row, index) => {
        const fallback = FALLBACK_PRODUCTS[index] || FALLBACK_PRODUCTS[0];
        const categoryLabel = row.category
          ? row.category.charAt(0).toUpperCase() + row.category.slice(1)
          : "Footwear";
        const rawPrice = Number(row.base_price) || 0;
        const formattedPrice =
          rawPrice >= 10000 ? Math.round(rawPrice / 1000) : rawPrice || fallback.price;

        return {
          id: row.id,
          name: row.name || fallback.name,
          category: row.category || fallback.category,
          sub: fallback.sub || `${categoryLabel} · Premium`,
          price: formattedPrice,
          image_url: row.image_url || fallback.image_url,
          glyph: row.category === "boot" ? "boot" : "sneaker",
          tileBg: fallback.tileBg || "bg-[#eae5d5]",
          isWishlisted: fallback.isWishlisted || false,
        };
      });
    }
  } catch (error) {
    console.warn("Could not query database products, falling back to static reference:", error);
  }

  return FALLBACK_PRODUCTS;
}

export default async function CustomerHomePage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen w-full bg-white text-[#0e0e0c]">
      
      {/* ================= STORE TOP NAV ================= */}
      <Navbar activePage="home" />

      {/* ================= HERO SECTION ================= */}
      <HeroSection />

      {/* ================= CATEGORY STRIP ================= */}
      <section className="w-full border-b border-[#e4e0d2] bg-white grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#e4e0d2]">
        <div className="p-8 lg:px-16 lg:py-10 flex flex-col gap-2 hover:bg-[#faf8f4] transition-colors">
          <span className="font-mono text-[11px] text-[#8f8a7a]">01</span>
          <h3 className="font-['Space_Grotesk'] text-[19px] font-bold text-[#0e0e0c]">Sneakers</h3>
          <Link
            href="/products?category=sneaker"
            className="text-[12.5px] text-[#3a382f] inline-flex items-center gap-1 hover:text-[#0e0e0c] mt-1"
          >
            Shop 42 styles →
          </Link>
        </div>

        <div className="p-8 lg:px-16 lg:py-10 flex flex-col gap-2 hover:bg-[#faf8f4] transition-colors">
          <span className="font-mono text-[11px] text-[#8f8a7a]">02</span>
          <h3 className="font-['Space_Grotesk'] text-[19px] font-bold text-[#0e0e0c]">Boots</h3>
          <Link
            href="/products?category=boot"
            className="text-[12.5px] text-[#3a382f] inline-flex items-center gap-1 hover:text-[#0e0e0c] mt-1"
          >
            Shop 26 styles →
          </Link>
        </div>

        <div className="p-8 lg:px-16 lg:py-10 flex flex-col gap-2 hover:bg-[#faf8f4] transition-colors">
          <span className="font-mono text-[11px] text-[#8f8a7a]">03</span>
          <h3 className="font-['Space_Grotesk'] text-[19px] font-bold text-[#0e0e0c]">Trainers</h3>
          <Link
            href="/products?category=trainer"
            className="text-[12.5px] text-[#3a382f] inline-flex items-center gap-1 hover:text-[#0e0e0c] mt-1"
          >
            Shop 18 styles →
          </Link>
        </div>
      </section>

      {/* ================= BEST SELLERS ================= */}
      <HomeBestSellers initialProducts={products} />

      {/* ================= STORY / CRAFT SECTION ================= */}
      <section className="w-full bg-[#0e0e0c] text-[#efeadb] px-6 sm:px-10 lg:px-16 py-18 lg:py-24">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="text-[#a8a394] text-[11px] uppercase tracking-[0.14em] font-medium block mb-2">
              Craft
            </span>
            <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl lg:text-[34px] font-bold leading-tight mb-4 text-[#efeadb]">
              Every pair passes through 34 hands before it reaches yours.
            </h2>
            <p className="text-[#c9c4b3] text-[14.5px] leading-relaxed max-w-[480px]">
              Aven works with a single tannery in Léon and a small outsole partner in Maine. No seasonal filler drops — just a tight, considered line built to outlast its box.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 sm:gap-12 md:justify-end">
            <div>
              <b className="font-['Space_Grotesk'] text-3xl sm:text-[34px] font-bold text-[#e7c94a] block leading-none">
                34
              </b>
              <span className="text-[11px] text-[#a8a394] uppercase tracking-[0.08em] block mt-2">
                Hands per pair
              </span>
            </div>

            <div>
              <b className="font-['Space_Grotesk'] text-3xl sm:text-[34px] font-bold text-[#e7c94a] block leading-none">
                2
              </b>
              <span className="text-[11px] text-[#a8a394] uppercase tracking-[0.08em] block mt-2">
                Manufacturing partners
              </span>
            </div>

            <div>
              <b className="font-['Space_Grotesk'] text-3xl sm:text-[34px] font-bold text-[#e7c94a] block leading-none">
                8yr
              </b>
              <span className="text-[11px] text-[#a8a394] uppercase tracking-[0.08em] block mt-2">
                Sole warranty
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= STORE FOOTER ================= */}
      <footer className="w-full border-t border-[#e4e0d2] bg-white px-6 sm:px-10 lg:px-16 py-14 lg:py-20">
        <div className="w-full grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="font-['Space_Grotesk'] font-bold text-[20px] mb-2.5 text-[#0e0e0c]">
              AVEN.
            </div>
            <p className="text-[#8f8a7a] text-[13px] max-w-[240px] leading-relaxed">
              Considered footwear for men, made to be worn in.
            </p>
          </div>

          <div>
            <h3 className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[#8f8a7a] mb-3.5">
              Shop
            </h3>
            <Link href="/products?category=sneaker" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Sneakers
            </Link>
            <Link href="/products?category=boot" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Boots
            </Link>
            <Link href="/products?category=trainer" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Trainers
            </Link>
            <Link href="/products?sale=true" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Sale
            </Link>
          </div>

          <div>
            <h3 className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[#8f8a7a] mb-3.5">
              Company
            </h3>
            <Link href="#" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              About
            </Link>
            <Link href="#" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Stores
            </Link>
            <Link href="#" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Craft
            </Link>
          </div>

          <div>
            <h3 className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[#8f8a7a] mb-3.5">
              Support
            </h3>
            <Link href="#" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Help
            </Link>
            <Link href="#" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Delivery
            </Link>
            <Link href="#" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Returns
            </Link>
          </div>

          <div>
            <h3 className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[#8f8a7a] mb-3.5">
              Contact
            </h3>
            <a href="tel:+12045780492" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              +1 204 578 0492
            </a>
            <a href="mailto:hello@aven.com" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              hello@aven.com
            </a>
          </div>
        </div>
      </footer>

    </main>
  );
}
