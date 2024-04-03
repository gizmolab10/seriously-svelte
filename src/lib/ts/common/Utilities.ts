import { k, get, Path, Size, Point, Angles, Quadrant, IDBrowser, getContext, setContext } from './GlobalImports';
import { s_scale_factor, s_thing_fontFamily } from './State';

class Utilities {
	noop() {}
	ignore(event: Event) {}
	roundToEven(n: number): number{ return Math.round(n / 2) * 2; }
	sort_byOrder(array: Array<Path>) { return array.sort( (a: Path, b: Path) => { return a.order - b.order; }); }


	get windowSize(): Size {
		const scaleFactor = get(s_scale_factor);
		return new Size(window.innerWidth / scaleFactor, window.innerHeight / scaleFactor);
	}

	get isServerLocal(): boolean {
		const hostname = window.location.hostname;
		return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
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

	remove<T>(from: Array<T>, item: T): void {
		const index = from.findIndex((element: T) => element === item);
		if (index !== -1) {
			from.splice(index, 1);
		}
	}

	sort_byTitleTop(array: Array<Path>) {
		return array.sort( (a: Path, b: Path) => {
			const aTop = a.titleRect?.origin.y;
			const bTop = b.titleRect?.origin.y;
			return (!aTop || !bTop) ? 0 : aTop - bTop;
		});
	}

	point_quadrant(point: Point): Quadrant {
		const x = point.x;
		const y = point.y;
		if (x >= 0 && y >= 0) {
			return Quadrant.upperRight;
		} else if (x >= 0 && y < 0) {
			return Quadrant.lowerRight;
		} else if (x < 0 && y >= 0) {
			return Quadrant.upperLeft;
		} else {
			return Quadrant.lowerLeft;
		}
	}

	angle_quadrant(angle: number): Quadrant {
		const normalized = angle % Angles.full;
		if (normalized.isBetween(0, Angles.quarter, true)) { return Quadrant.lowerRight; }
		if (normalized.isBetween(Angles.quarter, Angles.half, true)) { return Quadrant.lowerLeft;}
		if (normalized.isBetween(Angles.half, Angles.threeQuarters, true)) { return Quadrant.upperLeft;}
		return Quadrant.upperRight;
	}

	getFontOf(element: HTMLElement): string {
		const computedStyle: CSSStyleDeclaration = window.getComputedStyle(element);
		const fontFamily: string = computedStyle.fontFamily;
		const fontSize: string = computedStyle.fontSize;
		
		return `${fontSize} ${fontFamily}`;
	}

	get device_isMobile(): boolean {
		const userAgent = navigator.userAgent;
		if (/android/i.test(userAgent) || /iPhone|iPad|iPod/i.test(userAgent)) {    // Check for phones
			return true;
		}
		if (/iPad|Android|Touch/i.test(userAgent) && !(window as any).MSStream) {    // Check for tablets
			return true;
		}
		return false;
	}

	removeAll(item: string, from: string): string {
		var to = from;
		var length = from.length;
		do {
			length = to.length;
			to = to.replace(item, k.empty);
		} while (length != to.length)
		return to;
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

	get browserType(): IDBrowser {
		const userAgent: string = navigator.userAgent;

		switch (true) {
			case /msie (\d+)/i.test(userAgent) ||
				/trident\/.*; rv:(\d+)/i.test(userAgent):	return IDBrowser.explorer;
			case /(chrome|crios)\/(\d+)/i.test(userAgent):	return IDBrowser.chrome;
			case /firefox\/(\d+)/i.test(userAgent):			return IDBrowser.firefox;
			case /opr\/(\d+)/i.test(userAgent):				return IDBrowser.opera;
			case /orion\/(\d+)/i.test(userAgent):			return IDBrowser.orion;
			case /safari\/(\d+)/i.test(userAgent):			return IDBrowser.safari;
			default:										return IDBrowser.unknown
		}
	}

	async paths_orders_normalize_remoteMaybe(array: Array<Path>, remoteWrite: boolean = true) {
		this.sort_byOrder(array);
		await (async () => {
			array.forEach(async (path, index) => {
				if (path.order != index) {
					await (async () => {
						await path.relationship?.order_setTo(index, remoteWrite);
					})();
				}
			});
		})();
	}

	getWidthOf(s: string): number {
		const element: HTMLElement = document.createElement('div');
		element.style.font = k.thing_fontSize + 'px ' + get(s_thing_fontFamily);
		element.style.left = '-9999px'; // offscreen
		element.style.padding = '0px 0px 0px 0px';
		element.style.position = 'absolute';
		element.style.whiteSpace = 'pre';
		element.textContent = s;
		
		document.body.appendChild(element);
		const width: number = element.scrollWidth;
		document.body.removeChild(element);

		return width;
	}

}

export const u = new Utilities();
