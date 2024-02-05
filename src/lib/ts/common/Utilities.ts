import { s_thing_fontSize, s_thing_fontFamily } from '../managers/State';
import { get, Path, TypeB } from './GlobalImports';

class Utilities {
	noop() {}
	ignore(event: Event) {}
	roundToEven(n: number): number{ return Math.round(n / 2) * 2; }
	sort_byOrder(array: Array<Path>) { return array.sort( (a: Path, b: Path) => { return a.order - b.order; }); }

	async paths_orders_normalize_remoteMaybe(array: Array<Path>, remoteWrite: boolean = true) {
		this.sort_byOrder(array);
		array.forEach((path, index) => {
			if (path.order != index) {
				(async () => {
					await path.order_setTo(index, remoteWrite);
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

	getBrowserType(): TypeB {
		const userAgent: string = navigator.userAgent;

		switch (true) {
			case /msie (\d+)/i.test(userAgent) ||
				/trident\/.*; rv:(\d+)/i.test(userAgent):	return TypeB.explorer;
			case /(chrome|crios)\/(\d+)/i.test(userAgent):	return TypeB.chrome;
			case /firefox\/(\d+)/i.test(userAgent):			return TypeB.firefox;
			case /opr\/(\d+)/i.test(userAgent):				return TypeB.opera;
			case /orion\/(\d+)/i.test(userAgent):			return TypeB.orion;
			case /safari\/(\d+)/i.test(userAgent):			return TypeB.safari;
			default:										return TypeB.unknown
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
