export const convertToRealisticSketch = (imageUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const w = img.width;
      const h = img.height;

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;

      // Draw image
      ctx.drawImage(img, 0, 0, w, h);

      let imgData = ctx.getImageData(0, 0, w, h);
      let data = imgData.data;

      // 1. Convert to grayscale
      for (let i = 0; i < data.length; i += 4) {
        let g = (data[i] + data[i+1] + data[i+2]) / 3;
        data[i] = data[i+1] = data[i+2] = g;
      }

      // 2. Sobel Edge detection
      const sobel = (x: number, y: number) => {
        const index = (y * w + x) * 4;
        return data[index];
      };

      const output = new Uint8ClampedArray(data.length);

      const gx = [-1,0,1, -2,0,2, -1,0,1];
      const gy = [-1,-2,-1, 0,0,0, 1,2,1];

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          let px = 0, py = 0;
          let k = 0;

          for (let yy = -1; yy <= 1; yy++) {
            for (let xx = -1; xx <= 1; xx++) {
              let val = sobel(x + xx, y + yy);
              px += gx[k] * val;
              py += gy[k] * val;
              k++;
            }
          }

          let mag = Math.sqrt(px * px + py * py);
          const i = (y * w + x) * 4;

          output[i] = output[i+1] = output[i+2] = 255 - mag;
          output[i+3] = 255;
        }
      }

      // 3. Add graphite paper texture
      ctx.putImageData(new ImageData(output, w, h), 0, 0);

      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#dcdcdc";
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1.0;

      resolve(canvas.toDataURL("image/png"));
    };
  });
};
