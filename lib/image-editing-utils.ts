export function applyGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;     // Red
    data[i + 1] = avg; // Green
    data[i + 2] = avg; // Blue
  }
  return imageData;
}

export function applySepia(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const tr = 0.393 * data[i] + 0.769 * data[i + 1] + 0.189 * data[i + 2];
    const tg = 0.349 * data[i] + 0.686 * data[i + 1] + 0.168 * data[i + 2];
    const tb = 0.272 * data[i] + 0.534 * data[i + 1] + 0.131 * data[i + 2];
    data[i] = tr > 255 ? 255 : tr;
    data[i + 1] = tg > 255 ? 255 : tg;
    data[i + 2] = tb > 255 ? 255 : tb;
  }
  return imageData;
}

export function cropImage(imageData: ImageData, x: number, y: number, width: number, height: number): ImageData {
  const croppedData = new ImageData(width, height);
  const sourceData = imageData.data;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const sourceIndex = ((y + row) * imageData.width + (x + col)) * 4;
      const targetIndex = (row * width + col) * 4;
      croppedData.data[targetIndex] = sourceData[sourceIndex];     // Red
      croppedData.data[targetIndex + 1] = sourceData[sourceIndex + 1]; // Green
      croppedData.data[targetIndex + 2] = sourceData[sourceIndex + 2]; // Blue
      croppedData.data[targetIndex + 3] = sourceData[sourceIndex + 3]; // Alpha
    }
  }
  return croppedData;
}
