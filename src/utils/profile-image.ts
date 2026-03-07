"use client";

const DEFAULT_OUTPUT_WIDTH = 720;
const DEFAULT_OUTPUT_HEIGHT = 1080;
const DEFAULT_MAX_BYTES = 420_000;
const DEFAULT_MIME_TYPE = "image/jpeg";

function estimateDataUrlBytes(dataUrl: string) {
  const [, payload = ""] = dataUrl.split(",");
  return Math.floor((payload.length * 3) / 4);
}

function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to read the selected image."));
    };

    image.src = objectUrl;
  });
}

function getPortraitCrop(imageWidth: number, imageHeight: number, targetAspectRatio: number) {
  const sourceAspectRatio = imageWidth / imageHeight;

  if (sourceAspectRatio > targetAspectRatio) {
    const cropWidth = imageHeight * targetAspectRatio;

    return {
      sx: (imageWidth - cropWidth) / 2,
      sy: 0,
      sw: cropWidth,
      sh: imageHeight,
    };
  }

  const cropHeight = imageWidth / targetAspectRatio;
  const topBias = (imageHeight - cropHeight) * 0.14;

  return {
    sx: 0,
    sy: Math.max(0, topBias),
    sw: imageWidth,
    sh: cropHeight,
  };
}

export async function createIdCardImageDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }

  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Please upload an image smaller than 12 MB.");
  }

  const image = await loadImageElement(file);
  const canvas = document.createElement("canvas");
  canvas.width = DEFAULT_OUTPUT_WIDTH;
  canvas.height = DEFAULT_OUTPUT_HEIGHT;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("This browser could not process the uploaded image.");
  }

  const crop = getPortraitCrop(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    DEFAULT_OUTPUT_WIDTH / DEFAULT_OUTPUT_HEIGHT,
  );

  context.fillStyle = "#f1f1f1";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.filter = "contrast(1.05) saturate(0.92)";
  context.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvas.width, canvas.height);
  context.filter = "none";

  let quality = 0.88;
  let output = canvas.toDataURL(DEFAULT_MIME_TYPE, quality);

  while (estimateDataUrlBytes(output) > DEFAULT_MAX_BYTES && quality > 0.46) {
    quality -= 0.08;
    output = canvas.toDataURL(DEFAULT_MIME_TYPE, quality);
  }

  return output;
}
