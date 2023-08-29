import { Thing } from './GlobalImports';
import convert from 'color-convert';

export function noop() {}

export function log(target: any, key: string) {
  console.log(`Method \'${key}\' is called on class \'${target.constructor.name}\'`);
}

export function sortAccordingToOrder(array: Array<Thing>) {
  return array.sort( (a: Thing, b: Thing) => { return a.order - b.order; });
}

export function normalizeOrderOf(array: Array<Thing>) {
  // hierarchy.relationships_refreshKnowns(); // order is stored in relationships
  sortAccordingToOrder(array);
  for (let index = 0; index < array.length; index++) {
    const thing = array[index];
    if (thing.order != index) {
      thing.setOrderTo(index);
    }
  }
}

export function removeAll(item: string, from: string): string {
  var to = from;
  var length = from.length;
  do {
    length = to.length;
    to = to.replace(item, '');
  } while (length != to.length)
  return to;
}

export function apply(startStop: (flag: boolean) => void, callback: () => void): void {
  startStop(true);
  callback();
  startStop(false);
}

// export function desaturateBy(color: string, desaturateBy: number, brightenBy: number): string {}

export function desaturateBy(color: string, desaturationPercentage: number, brightnessPercentage: number): string {
  const hexColor = /^#(?:[0-9a-fA-F]{3}){1,2}$/; // Regex to match hex color format

  if (hexColor.test(color)) {
    let r, g, b;

    if (color.length === 4) {
      // Convert short hex color to full format
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    } else {
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    }

    // Desaturate the color
    const grayValue = 0.2989 * r + 0.587 * g + 0.114 * b;
    const newR = Math.min(255, Math.floor(grayValue + (r - grayValue) * (1 - desaturationPercentage / 100)));
    const newG = Math.min(255, Math.floor(grayValue + (g - grayValue) * (1 - desaturationPercentage / 100)));
    const newB = Math.min(255, Math.floor(grayValue + (b - grayValue) * (1 - desaturationPercentage / 100)));

    // Calculate brighter values for each channel
    const finalR = Math.min(255, Math.floor(newR + newR * (brightnessPercentage / 100)));
    const finalG = Math.min(255, Math.floor(newG + newG * (brightnessPercentage / 100)));
    const finalB = Math.min(255, Math.floor(newB + newB * (brightnessPercentage / 100)));

    // Convert the new RGB values to hex
    const newHexColor = `#${finalR.toString(16).padStart(2, '0')}${finalG.toString(16).padStart(2, '0')}${finalB.toString(16).padStart(2, '0')}`;
    return newHexColor;
  } else {
    // Convert color name to RGB using color-convert library
    const rgbArray = convert.keyword.rgb(color);
    
    if (!rgbArray) {
      // Invalid color name
      return color;
    }

    const [r, g, b] = rgbArray;

    // Desaturate the color
    const grayValue = 0.2989 * r + 0.587 * g + 0.114 * b;
    const newR = Math.min(255, Math.floor(grayValue + (r - grayValue) * (1 - desaturationPercentage / 100)));
    const newG = Math.min(255, Math.floor(grayValue + (g - grayValue) * (1 - desaturationPercentage / 100)));
    const newB = Math.min(255, Math.floor(grayValue + (b - grayValue) * (1 - desaturationPercentage / 100)));

    // Calculate brighter values for each channel
    const finalR = Math.min(255, Math.floor(newR + newR * (brightnessPercentage / 100)));
    const finalG = Math.min(255, Math.floor(newG + newG * (brightnessPercentage / 100)));
    const finalB = Math.min(255, Math.floor(newB + newB * (brightnessPercentage / 100)));

    // Convert the new RGB values to hex
    const newHexColor = `#${finalR.toString(16).padStart(2, '0')}${finalG.toString(16).padStart(2, '0')}${finalB.toString(16).padStart(2, '0')}`;
    return newHexColor;
  }
}
