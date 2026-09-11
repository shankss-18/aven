import Link from "next/link";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HomeProductSections from "@/components/HomeProductSections";
import db from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "AVEN — Premium Sneakers & Footwear for Men",
  description:
    "Discover premium men's sneakers, Chelsea boots, and high-tops at AVEN. Considered footwear crafted with care, built to last.",
  alternates: { canonical: "/" },
};

async function getRecentProducts() {
  try {
    const result = await db.execute({
      sql: "SELECT id, name, description, category, base_price, image_url, created_at FROM products WHERE (is_active = 1 OR is_active IS NULL) ORDER BY created_at DESC, id DESC LIMIT 4",
      args: [],
    });

    if (result && result.rows) {
      if (result.rows.length === 0) {
        return [];
      }
      return result.rows.map((row) => {
        const categoryLabel = row.category
          ? row.category.charAt(0).toUpperCase() + row.category.slice(1)
          : "Footwear";
        const rawPrice = Number(row.base_price) || 0;
        // In DB, base_price is stored in paise (1 INR = 100 paise)
        const priceInRupees = rawPrice > 0 ? Math.round(rawPrice / 100) : 0;
        const cleanName = row.name ? row.name.split(" | ")[0].trim() : "Footwear";

        return {
          id: row.id,
          name: cleanName,
          category: row.category || "footwear",
          sub: `${categoryLabel} · Men`,
          price: priceInRupees,
          base_price: rawPrice,
          image_url: row.image_url || "",
          tileBg: "bg-[#eae5d5]",
        };
      });
    }
  } catch (error) {
    console.warn("Could not query recent products:", error);
  }

  return [];
}

async function getOfferProducts() {
  try {
    // Select products for Special Offers section (ordered by base_price or offset)
    const result = await db.execute({
      sql: `SELECT id, name, description, category, base_price, image_url, created_at 
            FROM products 
            WHERE (is_active = 1 OR is_active IS NULL) 
            ORDER BY base_price ASC, id ASC 
            LIMIT 4`,
      args: [],
    });

    if (result && result.rows) {
      if (result.rows.length === 0) {
        return [];
      }
      return result.rows.map((row) => {
        const categoryLabel = row.category
          ? row.category.charAt(0).toUpperCase() + row.category.slice(1)
          : "Footwear";
        const rawPrice = Number(row.base_price) || 0;
        // In DB, base_price is stored in paise (1 INR = 100 paise)
        const priceInRupees = rawPrice > 0 ? Math.round(rawPrice / 100) : 0;
        const cleanName = row.name ? row.name.split(" | ")[0].trim() : "Footwear";

        return {
          id: row.id,
          name: cleanName,
          category: row.category || "footwear",
          sub: `${categoryLabel} · Special`,
          price: priceInRupees,
          base_price: rawPrice,
          image_url: row.image_url || "",
          tileBg: "bg-[#eae5d5]",
        };
      });
    }
  } catch (error) {
    console.warn("Could not query offer products:", error);
  }

  return [];
}

export default async function CustomerHomePage() {
  const [recentProducts, offerProducts] = await Promise.all([
    getRecentProducts(),
    getOfferProducts(),
  ]);

  return (
    <main className="min-h-screen w-full bg-white text-[#0e0e0c]">
      
      {/* ================= STORE TOP NAV (Search bar hidden on homepage) ================= */}
      <Navbar activePage="home" showSearch={false} />

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

      {/* ================= 2 PRODUCT SECTIONS: RECENT & OFFERS ================= */}
      <HomeProductSections
        recentProducts={recentProducts}
        offerProducts={offerProducts}
      />

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
              <b className="font-['Space_Grotesk'] text-3xl sm:text-[34px] font-bold text-[#b7e8f7] block leading-none">
                34
              </b>
              <span className="text-[11px] text-[#a8a394] uppercase tracking-[0.08em] block mt-2">
                Hands per pair
              </span>
            </div>

            <div>
              <b className="font-['Space_Grotesk'] text-3xl sm:text-[34px] font-bold text-[#b7e8f7] block leading-none">
                2
              </b>
              <span className="text-[11px] text-[#a8a394] uppercase tracking-[0.08em] block mt-2">
                Manufacturing partners
              </span>
            </div>

            <div>
              <b className="font-['Space_Grotesk'] text-3xl sm:text-[34px] font-bold text-[#b7e8f7] block leading-none">
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
              AVEN
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
