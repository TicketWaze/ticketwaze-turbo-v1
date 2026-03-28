/* eslint-disable @typescript-eslint/no-explicit-any */
export default function getCroppedImg(
  imageSrc: string,
  crop: any,
  maxSize: number = 800, // max width/height in pixels
  quality: number = 0.8, // JPEG quality 0–1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      // Scale down if crop dimensions exceed maxSize
      const scale = Math.min(1, maxSize / Math.max(crop.width, crop.height));
      const outputWidth = Math.round(crop.width * scale);
      const outputHeight = Math.round(crop.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext("2d");

      ctx?.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        outputWidth, // draw into the smaller canvas = compression
        outputHeight,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        quality, // 0.8 = good quality, much smaller file
      );
    };
    image.onerror = () => reject(new Error("Image load error"));
  });
}
