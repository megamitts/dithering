/* dither library adjusted for p5js */


let img;
let dithered;
let imageData;
let Dither;

function preload() {
img = loadImage('mouse.jpeg');
}

function setup() {
  createCanvas(400, 400);
  // img = createCapture(VIDEO);
  // img.size(400, 400);
  // img.hide();
  // noLoop();
  
  Dither = new CanvasDither();
  
}

function draw() {
  background(220);

  
  
  // Convert p5.Image → ImageData
  let gfx = createGraphics(img.width, img.height);
  gfx.image(img, 0, 0);
  let ctx = gfx.canvas.getContext('2d');
  let imageData = ctx.getImageData(0, 0, img.width, img.height);

  // Dither (Dither is global from canvas-dither.js)
  //let dithered = Dither.atkinson(imageData);
  let dithered = Dither.floydsteinberg(imageData);
  //let dithered = Dither.grayscale(imageData);
    
  
//   // Convert ImageData → p5.Image
  let newImg = createImage(dithered.width, dithered.height);
  newImg.loadPixels();
  for (let i = 0; i < dithered.data.length; i++) {
    newImg.pixels[i] = dithered.data[i];
  }
  newImg.updatePixels();

  // Replace original img
  img = newImg;

  // Now you can keep using img directly
  image(img, 0, 0, width, height);
  
  
//   ctx.putImageData(dithered, 0, 0);

//   // Step 4: Draw onto main canvas
//   //image(gfx, 0, 0, width, height);
  
//   //img = gfx;
//   image(img, 0,0, 400, 400);
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