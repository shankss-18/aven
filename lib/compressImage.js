/**
 * Client-side image optimization helper.
 * Scales down giant photos (e.g. 10MB+ camera shots) to web-optimized dimensions (~1600px max)
 * while preserving format and crisp visual quality, keeping requests well within Vercel's 4.5MB payload limit.
 */
export async function compressImage(file, maxWidth = 1600, maxHeight = 1600, quality = 0.85) {
  if (typeof window === "undefined" || !file || !(file instanceof File || file instanceof Blob)) {
    return file;
  }

  // Skip SVGs, GIFs, or files already under 400KB
  if (
    file.type === "image/svg+xml" ||
    file.type === "image/gif" ||
    (file.size && file.size < 400 * 1024)
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width <= maxWidth && height <= maxHeight && file.size < 800 * 1024) {
          resolve(file);
          return;
        }

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const targetType = file.type === "image/png" ? "image/png" : "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (!blob || (file.size && blob.size >= file.size)) {
              resolve(file);
            } else {
              const compressed = new File([blob], file.name || "image.jpg", {
                type: targetType,
                lastModified: Date.now(),
              });
              resolve(compressed);
            }
          },
          targetType,
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
