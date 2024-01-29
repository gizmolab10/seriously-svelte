import { s_thing_fontSize, s_thing_fontFamily } from '../managers/State';
import { get, Thing, BrowserType } from './GlobalImports';

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

}

export const u = new Utilities();
