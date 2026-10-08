// Shrinks uploads in the browser before they are committed, so the repo and the
// live site stay light no matter what size photo the admin picks.

const MAX_EDGE = 1600;
const QUALITY = 0.82;

export async function optimiseImage(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const webp = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
    // Keep the original if the browser can't encode WebP or it came out larger.
    return webp && webp.type === "image/webp" && webp.size < file.size ? webp : file;
  } catch {
    return file;
  }
}
