/* dither library adjusted for p5js */


let img;
let dithered;
let imageData;
let Dither;



function setup() {
  createCanvas(400, 400);
  img = createCapture(VIDEO);
  img.size(400, 400);
  img.hide();
  
  
  Dither = new CanvasDither();
  
}

function draw() {
  background(220);

  // grab webcam frame
  let gfx = createGraphics(img.width, img.height);
  gfx.image(img, 0, 0);
  let ctx = gfx.canvas.getContext('2d');
  let imageData = ctx.getImageData(0, 0, img.width, img.height);

  // apply dithering
  //let dithered = Dither.floydsteinberg(imageData);

  //let dithered = Dither.floydsteinbergGreen(imageData);
  
  
  let dithered = Dither.thresholdGreen(imageData, 100);
  
  // convert ImageData → p5.Image
  let newImg = createImage(dithered.width, dithered.height);
  newImg.loadPixels();
  // for (let i = 0; i < dithered.data.length; i++) {
  //   newImg.pixels[i] = dithered.data[i];
  // }
  
  for (let i = 0; i < dithered.data.length; i += 4) {
  newImg.pixels[i]   = dithered.data[i];     // R
  newImg.pixels[i+1] = dithered.data[i+1];   // G
  newImg.pixels[i+2] = dithered.data[i+2];   // B
  newImg.pixels[i+3] = 255;                  // A (important!)
}

  newImg.updatePixels();

  // draw result to canvas
  image(newImg, 0, 0, width, height);
}




/**
 * Use the ImageData from a Canvas and turn the image in a 1-bit black and white image using dithering
 */
class CanvasDither {
  /**
     * Change the image to grayscale
     *
     * @param  {object}   image         The imageData of a Canvas 2d context
     * @return {object}                 The resulting imageData
     *
     */
  grayscale(image) {
    for (let i = 0; i < image.data.length; i += 4) {
      const luminance = (image.data[i] * 0.299) + (image.data[i + 1] * 0.587) + (image.data[i + 2] * 0.114);
      image.data.fill(luminance, i, i + 3);
    }

    return image;
  }

  greenscale(image) {
  for (let i = 0; i < image.data.length; i += 4) {
    const luminance = (image.data[i] * 0.299) + 
                      (image.data[i + 1] * 0.587) + 
                      (image.data[i + 2] * 0.114);

    // R = 0, G = luminance, B = 0
    image.data[i]     = 0;          // R
    image.data[i + 1] = luminance;  // G
    image.data[i + 2] = 0;          // B
    // leave alpha as-is
  }
  return image;
}
  
  
  /**
     * Change the image to blank and white using a simple threshold
     *
     * @param  {object}   image         The imageData of a Canvas 2d context
     * @param  {number}   threshold     Threshold value (0-255)
     * @return {object}                 The resulting imageData
     *
     */
  threshold(image, threshold) {
    for (let i = 0; i < image.data.length; i += 4) {
      const luminance = (image.data[i] * 0.299) + (image.data[i + 1] * 0.587) + (image.data[i + 2] * 0.114);

      const value = luminance < threshold ? 0 : 255;
      image.data.fill(value, i, i + 3);
      
    }

    return image;
  }

  
  
  thresholdGreen(image, threshold) {
    for (let i = 0; i < image.data.length; i += 4) {
      const luminance = (image.data[i] * 0.299) + (image.data[i + 1] * 0.587) + (image.data[i + 2] * 0.114);

      const value = luminance < threshold ? 0 : 255;
      //image.data.fill(value, i, i + 3);
      // R = 0, G = luminance, B = 0
    image.data[i]     = 0;          // R
    image.data[i + 1] = value;  // G
    image.data[i + 2] = 0;          // B
    // leave alpha as-is
    }

    return image;
  }
  
  /**
     * Change the image to blank and white using the Bayer algorithm
     *
     * @param  {object}   image         The imageData of a Canvas 2d context
     * @param  {number}   threshold     Threshold value (0-255)
     * @return {object}                 The resulting imageData
     *
     */
  bayer(image, threshold) {
    const thresholdMap = [
      [15, 135, 45, 165],
      [195, 75, 225, 105],
      [60, 180, 30, 150],
      [240, 120, 210, 90],
    ];

    for (let i = 0; i < image.data.length; i += 4) {
      const luminance = (image.data[i] * 0.299) + (image.data[i + 1] * 0.587) + (image.data[i + 2] * 0.114);

      const x = i / 4 % image.width;
      const y = Math.floor(i / 4 / image.width);
      const map = Math.floor((luminance + thresholdMap[x % 4][y % 4]) / 2);
      const value = map < threshold ? 0 : 255;
      image.data.fill(value, i, i + 3);
    }

    return image;
  }

  /**
     * Change the image to blank and white using the Floyd-Steinberg algorithm
     *
     * @param  {object}   image         The imageData of a Canvas 2d context
     * @return {object}                 The resulting imageData
     *
     */
  floydsteinberg(image) {
    const width = image.width;
    const luminance = new Uint8ClampedArray(image.width * image.height);

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      luminance[l] = (image.data[i] * 0.299) + (image.data[i + 1] * 0.587) + (image.data[i + 2] * 0.114);
    }

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      const value = luminance[l] < 129 ? 0 : 255;
      const error = Math.floor((luminance[l] - value) / 16);
      image.data.fill(value, i, i + 3);

      luminance[l + 1] += error * 7;
      luminance[l + width - 1] += error * 3;
      luminance[l + width] += error * 5;
      luminance[l + width + 1] += error * 1;
    }

    return image;
  }

  floydsteinbergGreen(image) {
  const width = image.width;
  const luminance = new Uint8ClampedArray(image.width * image.height);

  for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
    luminance[l] = (image.data[i] * 0.299) + 
                   (image.data[i + 1] * 0.587) + 
                   (image.data[i + 2] * 0.114);
  }

  for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
    const value = luminance[l] < 129 ? 0 : 255;
    const error = Math.floor((luminance[l] - value) / 16);

    // only green channel
    image.data[i]     = 0;
    image.data[i + 1] = value;
    image.data[i + 2] = 0;

    luminance[l + 1]        += error * 7;
    luminance[l + width - 1] += error * 3;
    luminance[l + width]     += error * 5;
    luminance[l + width + 1] += error * 1;
  }

  return image;
}

  
  /**
     * Change the image to blank and white using the Atkinson algorithm
     *
     * @param  {object}   image         The imageData of a Canvas 2d context
     * @return {object}                 The resulting imageData
     *
     */
  atkinson(image) {
    const width = image.width;
    const luminance = new Uint8ClampedArray(image.width * image.height);

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      luminance[l] = (image.data[i] * 0.299) + (image.data[i + 1] * 0.587) + (image.data[i + 2] * 0.114);
    }

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
      const value = luminance[l] < 129 ? 0 : 255;
      const error = Math.floor((luminance[l] - value) / 8);
      image.data.fill(value, i, i + 3);

      luminance[l + 1] += error;
      luminance[l + 2] += error;
      luminance[l + width - 1] += error;
      luminance[l + width] += error;
      luminance[l + width + 1] += error;
      luminance[l + 2 * width] += error;
    }

    return image;
  }
}