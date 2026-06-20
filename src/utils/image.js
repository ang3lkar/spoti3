import sharp from "sharp";

export async function cropToSquare(buffer) {
  const image = sharp(buffer);
  const { width, height } = await image.metadata();
  const size = Math.min(width, height);
  return image
    .extract({
      left: Math.floor((width - size) / 2),
      top: Math.floor((height - size) / 2),
      width: size,
      height: size,
    })
    .toBuffer();
}
