// Comprehensive color database & matching utilities for luxury footwear and fashion

export const COLOR_PALETTE = [
  // Monochromes, Whites & Creams
  { name: "Pitch Black", hex: "#000000" },
  { name: "Jet Black", hex: "#0A0A0A" },
  { name: "Obsidian Black", hex: "#111111" },
  { name: "Onyx Black", hex: "#1B1B1B" },
  { name: "Carbon Grey", hex: "#282828" },
  { name: "Anthracite", hex: "#34373D" },
  { name: "Charcoal Grey", hex: "#424242" },
  { name: "Gunmetal", hex: "#52595D" },
  { name: "Slate Grey", hex: "#64748B" },
  { name: "Cool Grey", hex: "#85929E" },
  { name: "Ash Grey", hex: "#9CA3AF" },
  { name: "Silver Grey", hex: "#C0C0C0" },
  { name: "Light Grey", hex: "#D1D5DB" },
  { name: "Fog Grey", hex: "#E5E7EB" },
  { name: "Platinum White", hex: "#F3F4F6" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Snow White", hex: "#FAFAFA" },
  { name: "Off White", hex: "#F5F5F0" },
  { name: "Bone White", hex: "#E3DFD0" },
  { name: "Chalk", hex: "#ECE8DF" },
  { name: "Sail", hex: "#FBF6EB" },
  { name: "Ivory", hex: "#FFFFF0" },
  { name: "Cream", hex: "#FDF8E6" },
  { name: "Vanilla", hex: "#F3E5AB" },
  { name: "Oatmeal", hex: "#D9D0C1" },

  // Tans, Browns & Earth Tones
  { name: "Warm Beige", hex: "#D4C5B9" },
  { name: "Sand Tan", hex: "#D8CBB8" },
  { name: "Khaki", hex: "#C3B091" },
  { name: "Desert Tan", hex: "#C29B68" },
  { name: "Wheat", hex: "#C69255" },
  { name: "Camel", hex: "#C19A6B" },
  { name: "Raw Umber", hex: "#826644" },
  { name: "Ochre Gold", hex: "#CC7722" },
  { name: "Mustard", hex: "#D4AF37" },
  { name: "Caramel Brown", hex: "#9A5B2D" },
  { name: "Cognac", hex: "#9E471C" },
  { name: "Saddle Brown", hex: "#8B4513" },
  { name: "Chestnut Brown", hex: "#8A6B4A" },
  { name: "Moccasin Brown", hex: "#7A5230" },
  { name: "Walnut Brown", hex: "#5C4033" },
  { name: "Mocha Brown", hex: "#4E3629" },
  { name: "Dark Chocolate", hex: "#3D2314" },
  { name: "Espresso", hex: "#2B1810" },
  { name: "Coffee", hex: "#3B2F2F" },
  { name: "Rust Amber", hex: "#B45309" },
  { name: "Terracotta", hex: "#E2725B" },
  { name: "Burnt Orange", hex: "#C2410C" },
  { name: "Amber Gold", hex: "#D97706" },

  // Greens
  { name: "Mint Green", hex: "#98FF98" },
  { name: "Seafoam Green", hex: "#93E9BE" },
  { name: "Pistachio", hex: "#93C572" },
  { name: "Sage Green", hex: "#9CA986" },
  { name: "Olive Drab", hex: "#6B8E23" },
  { name: "Olive Green", hex: "#4B5320" },
  { name: "Military Green", hex: "#3A4A3A" },
  { name: "Army Green", hex: "#4A5D4E" },
  { name: "Forest Green", hex: "#228B22" },
  { name: "Hunter Green", hex: "#1B4D3E" },
  { name: "Pine Green", hex: "#14532D" },
  { name: "Deep Forest Green", hex: "#10381F" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Jade Green", hex: "#00A86B" },
  { name: "Dark Teal", hex: "#0F4C5C" },
  { name: "Teal Green", hex: "#008080" },
  { name: "Cyan Aqua", hex: "#06B6D4" },

  // Blues
  { name: "Ice Blue", hex: "#D6EAF8" },
  { name: "Sky Blue", hex: "#87CEEB" },
  { name: "University Blue", hex: "#6CA0DC" },
  { name: "Steel Blue", hex: "#4682B4" },
  { name: "Denim Blue", hex: "#2B547E" },
  { name: "Cobalt Blue", hex: "#2563EB" },
  { name: "Royal Blue", hex: "#1D4ED8" },
  { name: "Deep Indigo", hex: "#1E1B4B" },
  { name: "Midnight Navy", hex: "#1A2530" },
  { name: "Obsidian Navy", hex: "#141C24" },
  { name: "Deep Navy", hex: "#0A1128" },
  { name: "Slate Blue", hex: "#475569" },

  // Reds, Pinks & Purples
  { name: "Crimson Red", hex: "#DC2626" },
  { name: "Chicago Red", hex: "#B91C1C" },
  { name: "Varsity Red", hex: "#C41E3A" },
  { name: "Ruby Red", hex: "#9B111E" },
  { name: "Burgundy Wine", hex: "#800020" },
  { name: "Maroon", hex: "#7F1D1D" },
  { name: "Oxblood", hex: "#4A1521" },
  { name: "Bordeaux", hex: "#5C0632" },
  { name: "Blush Pink", hex: "#FCE7F3" },
  { name: "Dusty Rose", hex: "#D8829D" },
  { name: "Salmon Pink", hex: "#FA8072" },
  { name: "Coral", hex: "#FF7F50" },
  { name: "Magenta", hex: "#D946EF" },
  { name: "Lavender", hex: "#C4B5FD" },
  { name: "Deep Purple", hex: "#581C87" },
  { name: "Eggplant", hex: "#311432" },
];

export const FOOTWEAR_COLOR_PRESETS = [
  { name: "Obsidian Black", hex: "#111111" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Bone White", hex: "#E3DFD0" },
  { name: "Desert Tan", hex: "#C29B68" },
  { name: "Chestnut Brown", hex: "#8A6B4A" },
  { name: "Military Green", hex: "#3A4A3A" },
  { name: "Midnight Navy", hex: "#1A2530" },
  { name: "Charcoal Grey", hex: "#424242" },
  { name: "Chicago Red", hex: "#B91C1C" },
  { name: "Burgundy Wine", hex: "#800020" },
];

/**
 * Converts 3 or 6 hex characters to RGB object
 */
export function hexToRgb(hex) {
  if (!hex || typeof hex !== "string") return null;
  let clean = hex.replace(/^#/, "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Normalizes hex string to "#RRGGBB" uppercase format, or fallback if invalid
 */
export function normalizeHex(hex, fallback = "#111111") {
  if (!hex || typeof hex !== "string") return fallback;
  let clean = hex.replace(/^#/, "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return "#" + clean.toUpperCase();
  }
  return fallback;
}

/**
 * Returns a strictly valid #rrggbb hex string for <input type="color">
 */
export function safePickerHex(hex) {
  return normalizeHex(hex, "#111111");
}

/**
 * Checks if a string is a valid 3- or 6-digit hex code (with or without #)
 */
export function isValidHex(hex) {
  if (!hex || typeof hex !== "string") return false;
  const clean = hex.replace(/^#/, "").trim();
  return /^[0-9A-Fa-f]{3}$/.test(clean) || /^[0-9A-Fa-f]{6}$/.test(clean);
}

/**
 * Automatically calculates the closest natural color name using
 * perceptually-weighted Euclidean distance in RGB space.
 */
export function hexToColorName(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "Custom Color";

  let closestName = "Custom Color";
  let minDistance = Infinity;

  for (const item of COLOR_PALETTE) {
    const itemRgb = hexToRgb(item.hex);
    if (!itemRgb) continue;

    // Perceptually weighted Euclidean color distance:
    // Human eyes are most sensitive to green (4x), then red (2x), then blue (3x)
    const dR = rgb.r - itemRgb.r;
    const dG = rgb.g - itemRgb.g;
    const dB = rgb.b - itemRgb.b;
    const distance = 2 * dR * dR + 4 * dG * dG + 3 * dB * dB;

    if (distance < minDistance) {
      minDistance = distance;
      closestName = item.name;
      if (distance === 0) break; // Exact match
    }
  }

  return closestName;
}

/**
 * Fallback to look up hex code from a color name if variant lacks color_hex
 */
export function getColorHex(colorName) {
  if (!colorName) return "#111111";
  const name = colorName.toLowerCase().trim();

  // Check exact palette matches
  const match = COLOR_PALETTE.find((c) => c.name.toLowerCase() === name);
  if (match) return match.hex;

  // Substring checks for common keywords
  if (name.includes("black") || name.includes("noir")) return "#111111";
  if (name.includes("pure white") || name.includes("snow")) return "#FFFFFF";
  if (name.includes("off white") || name.includes("sail")) return "#F5F5F0";
  if (name.includes("bone") || name.includes("chalk")) return "#E3DFD0";
  if (name.includes("grey") || name.includes("gray") || name.includes("slate")) return "#9CA3AF";
  if (name.includes("brown") || name.includes("chestnut")) return "#8A6B4A";
  if (name.includes("tan") || name.includes("sand") || name.includes("wheat")) return "#C29B68";
  if (name.includes("olive") || name.includes("army") || name.includes("military")) return "#3A4A3A";
  if (name.includes("green") || name.includes("emerald")) return "#14532D";
  if (name.includes("navy") || name.includes("midnight")) return "#1A2530";
  if (name.includes("blue") || name.includes("royal")) return "#2563EB";
  if (name.includes("burgundy") || name.includes("wine") || name.includes("maroon")) return "#800020";
  if (name.includes("red") || name.includes("crimson") || name.includes("chicago")) return "#B91C1C";

  return "#8F8A7A";
}
