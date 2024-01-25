import { s_thing_fontSize, s_thing_fontFamily } from '../managers/State';
import { get, Thing, BrowserType } from './GlobalImports';
import convert from 'color-convert';

class Utilities {
	noop() {}
	ignore(event: Event) {}
	roundToEven(n: number): number{ return Math.round(n / 2) * 2; }
	sort_byOrder(array: Array<Thing>) { return array.sort( (a: Thing, b: Thing) => { return a.order - b.order; }); }

	async orders_normalize_remoteMaybe(array: Array<Thing>, remoteWrite: boolean = true) {
		this.sort_byOrder(array);
		array.forEach((thing, index) => {
			if (thing.order != index) {
				(async () => {
					await thing.order_setTo(index, remoteWrite);
				})();
			}
		});
	}

	remove<T>(from: Array<T>, item: T): void {
		const index = from.findIndex((element: T) => element === item);
		if (index !== -1) {
			from.splice(index, 1);
		}
	}

	removeAll(item: string, from: string): string {
		var to = from;
		var length = from.length;
		do {
			length = to.length;
			to = to.replace(item, '');
		} while (length != to.length)
		return to;
	}

	apply(startStop: (flag: boolean) => void, callback: () => void): void {
		startStop(true);
		callback();
		startStop(false);
	}

	copyObject(obj: any) {
		const copiedObject = Object.create(Object.getPrototypeOf(obj));
		Object.assign(copiedObject, obj);
		return copiedObject;
	}

	isServerLocal(): boolean {
		const hostname = window.location.hostname;
		return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
	}

	convertToObject(instance: any, fields: Array<string>): object {
		const o: { [key: string]: any } = {};
		for (const field of fields) {
			if (instance.hasOwnProperty(field)) {
				o[field] = instance[field];
			}
		}
		return o;
	}

	getFontOf(element: HTMLElement): string {
		const computedStyle: CSSStyleDeclaration = window.getComputedStyle(element);
		const fontFamily: string = computedStyle.fontFamily;
		const fontSize: string = computedStyle.fontSize;
		
		return `${fontSize} ${fontFamily}`;
	}

	getWidthOf(s: string): number {
		const element: HTMLElement = document.createElement('div');
		element.style.font = get(s_thing_fontSize) + 'px ' + get(s_thing_fontFamily);
		element.style.left = '-9999px'; // offscreen
		element.style.padding = '0px 0px 0px 6px';
		element.style.position = 'absolute';
		element.style.whiteSpace = 'pre';
		element.textContent = s;
		
		document.body.appendChild(element);
		const width: number = element.scrollWidth;
		document.body.removeChild(element);

		return width;
	}

	getBrowserType(): BrowserType {
		const userAgent: string = navigator.userAgent;

		switch (true) {
			case /msie (\d+)/i.test(userAgent) ||
				/trident\/.*; rv:(\d+)/i.test(userAgent):	return BrowserType.explorer;
			case /(chrome|crios)\/(\d+)/i.test(userAgent):	return BrowserType.chrome;
			case /firefox\/(\d+)/i.test(userAgent):			return BrowserType.firefox;
			case /opr\/(\d+)/i.test(userAgent):				return BrowserType.opera;
			case /orion\/(\d+)/i.test(userAgent):			return BrowserType.orion;
			case /safari\/(\d+)/i.test(userAgent):			return BrowserType.safari;
			default:										return BrowserType.unknown
		}
	}

	isMobileDevice(): boolean {
		const userAgent = navigator.userAgent;
		
		if (/android/i.test(userAgent) || /iPhone|iPad|iPod/i.test(userAgent)) {    // Check for phones
			return true;
		}

		if (/iPad|Android|Touch/i.test(userAgent) && !(window as any).MSStream) {    // Check for tablets
			return true;
		}

		return false;
	}

	desaturateBy(color: string, desaturationPercentage: number, brightnessPercentage: number): string {
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
}

export const u = new Utilities();
