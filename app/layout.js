import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://aven-store.vercel.app";

export const metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "AVEN — Premium Sneakers & Footwear for Men",
    template: "%s | AVEN",
  },
  description:
    "Shop premium men's sneakers and footwear at AVEN. Considered footwear crafted with care — Chelsea boots, high-tops, and more. Free shipping on orders over ₹2,999.",
  keywords: [
    "men's sneakers",
    "premium footwear",
    "men's shoes India",
    "Chelsea boots",
    "high top sneakers",
    "luxury sneakers",
    "AVEN shoes",
    "men's fashion footwear",
  ],
  authors: [{ name: "AVEN" }],
  creator: "AVEN",
  publisher: "AVEN",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "AVEN",
    title: "AVEN — Premium Sneakers & Footwear for Men",
    description:
      "Shop premium men's sneakers and footwear at AVEN. Considered footwear crafted with care.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AVEN — Premium Sneakers & Footwear for Men",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AVEN — Premium Sneakers & Footwear for Men",
    description:
      "Shop premium men's sneakers and footwear at AVEN. Considered footwear crafted with care.",
    images: ["/og-image.jpg"],
    creator: "@aven_footwear",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col font-sans bg-white text-[#0e0e0c]"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
