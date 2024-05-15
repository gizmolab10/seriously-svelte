import { k, get, Rect, Size, Point, Angle, Quadrant, IDBrowser, Ancestry } from './GlobalImports';
import { s_scale_factor, s_thing_fontFamily } from '../state/State';
import Identifiable from "../structures/Identifiable";

class Utilities {
	noop() {}
	ignore(event: Event) {}
	roundToEven(n: number): number{ return Math.round(n / 2) * 2; }
	normalized_angle(angle: number) { return Angle.full.normalize(angle); }
	concatenateArrays(a: Array<any>, b: Array<any>): Array<any> { return [...a, ...b]; }
	strip_falsies(array: Array<any>): Array<any> { return array.filter(element => !!element); }
	quadrant_startAngle(angle: number): number { return this.startAngle_ofQuadrant(this.quadrant_ofNotNormalized(angle)); }
	sort_byOrder(array: Array<Ancestry>) { return array.sort( (a: Ancestry, b: Ancestry) => { return a.order - b.order; }); }
	strip_invalid(array: Array<any>): Array<any> { return this.strip_identifiableDuplicates(this.strip_falsies(array)); }

	boundingRectFor(element: HTMLElement): Rect | null{
		return Rect.createFromDOMRect(element.getBoundingClientRect());
	}

	uniquely_concatenateArrays(a: Array<any>, b: Array<any>): Array<any> {
		return this.strip_invalid(this.concatenateArrays(a, b));
	}

	degrees_of(angle: number) {
		const degrees = this.normalized_angle(angle) * 180 / Angle.half;
		return this.formatter_toFixed(1).format(degrees);
	}

	get windowSize(): Size {
		const ratio = get(s_scale_factor);
		return new Size(window.innerWidth / ratio, window.innerHeight / ratio);
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

	getFontOf(element: HTMLElement): string {
		const computedStyle: CSSStyleDeclaration = window.getComputedStyle(element);
		const fontFamily: string = computedStyle.fontFamily;
		const fontSize: string = computedStyle.fontSize;
		return `${fontSize} ${fontFamily}`;
	}

	remove<T>(from: Array<T>, item: T): void {
		const index = from.findIndex((element: T) => element === item);
		if (index !== -1) {
			from.splice(index, 1);
		}
	}

	hitTestFor(element: HTMLElement | null, at: Point): boolean {
		if (element) {
			const elementRect = this.boundingRectFor(element);
			return elementRect?.contains(at) ?? false;
		}
		return false;
	}

	formatter_toFixed(precision: number) {
		return new Intl.NumberFormat('en-US', {
			style: 'decimal',
			maximumFractionDigits: precision,
			minimumFractionDigits: precision
		});
	}

	sort_byTitleTop(ancestries: Array<Ancestry>) {
		return ancestries.sort( (a: Ancestry, b: Ancestry) => {
			const aTop = a.titleRect?.origin.y;
			const bTop = b.titleRect?.origin.y;
			return (!aTop || !bTop) ? 0 : aTop - bTop;
		});
	}

	startAngle_ofQuadrant(quadrant: Quadrant): number {
		switch (quadrant) {
			case Quadrant.upperRight: return Angle.threeQuarters;
			case Quadrant.lowerLeft:  return Angle.quarter;
			case Quadrant.upperLeft:  return Angle.half;
			default:				  return 0;
		}
	}

	angle_hasPositiveX(angle: number): boolean {
		switch(this.quadrant_ofNotNormalized(angle)) {
			case Quadrant.upperRight: return true;
			case Quadrant.lowerRight: return true;
			default: return false;
		}
	}

	quadrant_ofNotNormalized(angle: number): Quadrant {
		const normalized = this.normalized_angle(angle);
		let quadrant = Quadrant.upperRight;
		if (normalized.isBetween(0,				Angle.quarter,		 true)) { quadrant = Quadrant.lowerRight; }
		if (normalized.isBetween(Angle.quarter, Angle.half,			 true)) { quadrant = Quadrant.lowerLeft; }
		if (normalized.isBetween(Angle.half,	Angle.threeQuarters, true)) { quadrant = Quadrant.upperLeft; }
		return quadrant;
	}

	/// TODO this in between needs clock arithmetic (an extra parameter: clock's interval)

	isAlmost_horizontal(angle: number, almost: number = (Angle.half / 10)): boolean {
		for (const horizontal of [Angle.half, Angle.full]) {
			const delta = this.normalized_angle(angle - horizontal);
			if (delta.isClocklyBetween(-almost, almost, Angle.full)) {
				return true;
			}
		}
		return false;
	}

	strip_hidDuplicates(ancestries: Array<Ancestry>) {
		let ancestriesByHID: {[hash: number]: Ancestry} = {};
		for (const ancestry of ancestries) {
			ancestriesByHID[ancestry.ancestryHash] = ancestry;
		}
		return Object.values(ancestriesByHID);
	}

	strip_identifiableDuplicates(identifiables: Array<Identifiable>): Array<Identifiable> {
		let identifiablesByHID: {[hash: number]: Identifiable} = {};
		for (const identifiable of identifiables) {
			const hid = identifiable.idHashed;
			if (hid) {
				identifiablesByHID[hid] = identifiable;
			}
		}
		return Object.values(identifiablesByHID);
	}

	strip_thingDuplicates(ancestries: Array<Ancestry>) {
		let ancestriesByHID: {[hash: number]: Ancestry} = {};
		for (const ancestry of ancestries) {
			const hid = ancestry.thing?.id.hash();
			if (hid) {
				ancestriesByHID[hid] = ancestry;
			}
		}
		return Object.values(ancestriesByHID);
	}

	point_quadrant(point: Point): Quadrant {
		const x = point.x;
		const y = point.y;
		if		 (x >= 0 && y >= 0) { return Quadrant.upperRight;
		} else if (x >= 0 && y < 0) { return Quadrant.lowerRight;
		} else if (x < 0 && y >= 0) { return Quadrant.upperLeft;
		} else						{ return Quadrant.lowerLeft;
		}
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

	polygonPoints(radius: number, count: number, offset: number): Array<Point> {
		const increment = Angle.full / count;
		const radial = new Point(radius, 0);
		const points: Point[] = [];
		let angle = offset;
		let index = count;
		do {
			points.push(radial.rotate_by(angle));
			angle += increment;
			index--;
		} while (index > 0)
		return points;
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

	async ancestries_orders_normalize_remoteMaybe(array: Array<Ancestry>, remoteWrite: boolean = true) {
		this.sort_byOrder(array);
		await (async () => {
			array.forEach(async (ancestry, index) => {
				if (ancestry.order != index) {
					await (async () => {
						await ancestry.relationship?.order_setTo_remoteMaybe(index, remoteWrite);
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

	colorToHex(color: string): string {
		// Create a dummy element to apply the color and read it back
		const dummyElement = document.createElement("div");
		dummyElement.style.color = color;
		document.body.appendChild(dummyElement);

		// Use getComputedStyle to get the color value in rgb/rgba format
		const computedColor = getComputedStyle(dummyElement).color;
		document.body.removeChild(dummyElement);

		// Convert RGB/RGBA string to hex
		const rgb = computedColor.match(/\d+/g); // Extract numerical values for RGB

		if (!rgb) {
			throw new Error("Invalid color input");
		}

		let hexColor = "#";
		for (let i = 0; i < 3; i++) { // Only need RGB parts for hex
			let hexComponent = parseInt(rgb[i]).toString(16);
			if (hexComponent.length === 1) {
				hexComponent = "0" + hexComponent; // Padding
			}
			hexColor += hexComponent;
		}

		return hexColor;
	}

}

export const u = new Utilities();
