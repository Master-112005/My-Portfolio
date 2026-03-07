"use client";

const DEFAULT_OUTPUT_WIDTH = 720;
const DEFAULT_OUTPUT_HEIGHT = 1080;
const DEFAULT_MAX_BYTES = 420_000;
const DEFAULT_MIME_TYPE = "image/jpeg";
const PROJECT_OUTPUT_WIDTH = 1440;
const PROJECT_OUTPUT_HEIGHT = 900;
const PROJECT_MAX_BYTES = 260_000;
const MAX_INPUT_BYTES = 12 * 1024 * 1024;

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

function getCoverCrop(
  imageWidth: number,
  imageHeight: number,
  targetAspectRatio: number,
  verticalBias = 0.5,
) {
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
  const topBias = (imageHeight - cropHeight) * verticalBias;

  return {
    sx: 0,
    sy: Math.max(0, topBias),
    sw: imageWidth,
    sh: cropHeight,
  };
}

async function createProcessedImageDataUrl(
  file: File,
  {
    width,
    height,
    maxBytes,
    fillStyle,
    filter,
    verticalBias,
  }: {
    width: number;
    height: number;
    maxBytes: number;
    fillStyle: string;
    filter: string;
    verticalBias: number;
  },
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }

  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Please upload an image smaller than 12 MB.");
  }

  const image = await loadImageElement(file);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("This browser could not process the uploaded image.");
  }

  const crop = getCoverCrop(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    width / height,
    verticalBias,
  );

  context.fillStyle = fillStyle;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.filter = filter;
  context.drawImage(image, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, canvas.width, canvas.height);
  context.filter = "none";

  let quality = 0.88;
  let output = canvas.toDataURL(DEFAULT_MIME_TYPE, quality);

  while (estimateDataUrlBytes(output) > maxBytes && quality > 0.46) {
    quality -= 0.08;
    output = canvas.toDataURL(DEFAULT_MIME_TYPE, quality);
  }

  return output;
}

export async function createIdCardImageDataUrl(file: File) {
  return createProcessedImageDataUrl(file, {
    width: DEFAULT_OUTPUT_WIDTH,
    height: DEFAULT_OUTPUT_HEIGHT,
    maxBytes: DEFAULT_MAX_BYTES,
    fillStyle: "#f1f1f1",
    filter: "contrast(1.05) saturate(0.92)",
    verticalBias: 0.14,
  });
}

export async function createProjectImageDataUrl(file: File) {
  return createProcessedImageDataUrl(file, {
    width: PROJECT_OUTPUT_WIDTH,
    height: PROJECT_OUTPUT_HEIGHT,
    maxBytes: PROJECT_MAX_BYTES,
    fillStyle: "#0b1220",
    filter: "contrast(1.04) saturate(0.96)",
    verticalBias: 0.36,
  });
}
