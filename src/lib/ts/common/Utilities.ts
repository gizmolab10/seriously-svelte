import { s_graphRect, s_mouse_location, s_ring_rotation_radius } from '../state/Reactive_State';
import { s_thing_fontFamily, s_user_graphOffset } from '../state/Reactive_State';
import { IDBrowser, Ring_Zone } from './Enumerations';
import Identifiable from '../basis/Identifiable';
import { Size, Point } from '../geometry/Geometry';
import { Quadrant } from '../geometry/Angle';
import Ancestry from '../managers/Ancestry';
import { g } from '../state/Global_State';
import { transparentize } from 'color2k';
import { debug } from '../common/Debug';
import Angle from '../geometry/Angle';
import { get } from 'svelte/store';
import { k } from './Constants';

class Utilities {
	noop() {}
	ignore(event: Event) {}
	concatenateArrays(a: Array<any>, b: Array<any>): Array<any> { return [...a, ...b]; }
	get distance_fromCenter(): number { return this.vector_fromCenter?.magnitude ?? 0; }
	get angle_fromCenter(): number | null { return this.vector_fromCenter?.angle ?? null; }
	quadrant_ofAngle(angle: number): Quadrant { return new Angle(angle).quadrant_ofAngle; }
	pointFor_mouseEvent(event: MouseEvent) { return new Point(event.clientX, event.clientY); }
	location_ofMouseEvent(event: MouseEvent) { return new Point(event.clientX, event.clientY); }
	opacitize(color: string, amount: number): string { return transparentize(color, 1 - amount); }
	strip_invalid(array: Array<any>): Array<any> { return this.strip_identifiableDuplicates(this.strip_falsies(array)); }
	get vector_fromCenter(): Point | null { return this.vector_ofOffset_fromGraphCenter_toMouseLocation(g.graph_center); }
	sort_byOrder(array: Array<Ancestry>) { return array.sort( (a: Ancestry, b: Ancestry) => { return a.order - b.order; }); }
	uniquely_concatenateArrays(a: Array<any>, b: Array<any>): Array<any> { return this.strip_invalid(this.concatenateArrays(a, b)); }

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

	sort_byTitleTop(ancestries: Array<Ancestry>) {
		return ancestries.sort( (a: Ancestry, b: Ancestry) => {
			const aTop = a.titleRect?.origin.y;
			const bTop = b.titleRect?.origin.y;
			return (!aTop || !bTop) ? 0 : aTop - bTop;
		});
	}

	vector_ofOffset_fromGraphCenter_toMouseLocation(offset: Point): Point | null {
		const location = get(s_mouse_location);
		if (!!location) {
			const graphCenter = get(s_graphRect).origin.offsetBy(get(s_user_graphOffset));
			const distance = graphCenter.offsetBy(offset).distanceTo(location);
			return distance;
		}
		return null
	}

	strip_hidDuplicates(ancestries: Array<Ancestry>) {
		let ancestriesByHID: {[hash: number]: Ancestry} = {};
		ancestries.map(a => ancestriesByHID[a.idHashed] = a);
		return Object.values(ancestriesByHID);
	}

	strip_falsies(array: Array<any>): Array<any> {
		let truthies: Array<any> = [];
		for (const element of array) {
			if (!!element) {
				truthies.push(element);
			}
		}
		return truthies;
	}

	strip_identifiableDuplicates(identifiables: Array<Identifiable>): Array<Identifiable> {
		let identifiablesByHID: {[hash: number]: Identifiable} = {};
		for (const identifiable of identifiables) {
			const hid = identifiable.idHashed;
			if (!!hid || hid == 0) {
				identifiablesByHID[hid] = identifiable;
			}
		}
		return Object.values(identifiablesByHID);
	}

	strip_thingDuplicates_from(ancestries: Array<Ancestry>) {
		let ancestriesByHID: {[hash: number]: Ancestry} = {};
		for (const ancestry of ancestries) {
			const hid = ancestry.thing?.id.hash();
			if (!!hid || hid == 0) {
				ancestriesByHID[hid] = ancestry;
			}
		}
		return Object.values(ancestriesByHID);
	}

	basis_angle_ofQuadrant(quadrant: Quadrant): number {
		switch (quadrant) {
			case Quadrant.upperRight: return Angle.three_quarters;
			case Quadrant.lowerLeft:  return Angle.quarter;
			case Quadrant.upperLeft:  return Angle.half;
			default:				  return 0;
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

	removeAll(item: string, from: string): string {
		var to = from;
		var length = from.length;
		do {
			length = to.length;
			to = to.replace(item, '');
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
			points.push(Point.fromPolar(radius, angle));
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
		array.forEach(async (ancestry, index) => {
			if (ancestry.order != index) {
				const relationship = ancestry.relationship;
				relationship?.order_setTo_remoteMaybe(index, remoteWrite);
			}
		});
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

	get ringZone_forMouseLocation(): Ring_Zone {
		const distance = this.distance_fromCenter;
		const thick = k.ring_rotation_thickness;
		const inner = get(s_ring_rotation_radius);
		if (!!distance && distance <= inner + thick * 2) {
			if (distance > inner + thick) {
				return Ring_Zone.resize;
			} else if (distance > inner) {
				return Ring_Zone.rotate;
			}
			return Ring_Zone.paging;
		}
		return Ring_Zone.miss;
	}

	get ringCursor_forMouseLocation(): string {
		let cursor = k.cursor_default;
		const ring_zone = this.ringZone_forMouseLocation;
		switch (ring_zone) {
			case Ring_Zone.rotate: cursor = g.ring_rotation_state.cursor; break;
			case Ring_Zone.resize: cursor = g.ring_resizing_state.cursor; break;
		}
		debug.log_action(` ${cursor} cursor ${ring_zone} RING ZONE`);
		return `${cursor} !important`;
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

	sizeFrom_svgPath(svgPath: string): Size {
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		const commands = svgPath.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
		let x = 0, y = 0;
		for (const command of commands) {
			const type = command[0];
			const args = command.slice(1).trim().split(/[\s,]+/).map(Number);
			switch (type) {
				case 'M':
				case 'L': [x, y] = args; break;
				case 'a':
				case 'A': handleArcCommand(args); break;
				case 'H': x = args[0]; break;
				case 'V': y = args[0]; break;
				case 'Z': break; // Close path, no coordinates to update
				default: throw new Error(`Unsupported command: ${type}`);
			}
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}

		function handleArcCommand(args: number[]) {
			const startX = x;
			const startY = y;
			let [rx, ry, xAxisRotation, largeArcFlag, sweepFlag, endX, endY] = args;
			x = endX;
			y = endY;
			const xAxisRotationRad = (xAxisRotation * Math.PI) / 180;					// Convert rotation to radians
			const dx2 = (startX - endX) / 2.0;											// Compute the half distance between the current and the end point
			const dy2 = (startY - endY) / 2.0;
			const x1 = Math.cos(xAxisRotationRad) * dx2 + Math.sin(xAxisRotationRad) * dy2;			// Compute (x1, y1)
			const y1 = -Math.sin(xAxisRotationRad) * dx2 + Math.cos(xAxisRotationRad) * dy2;
			const radiiCheck = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);						// Ensure radii are large enough
			if (radiiCheck > 1) {
				rx *= Math.sqrt(radiiCheck);
				ry *= Math.sqrt(radiiCheck);
			}
			const sign = largeArcFlag === sweepFlag ? -1 : 1;							// Compute (cx1, cy1)
			const sq = ((rx * rx) * (ry * ry) - (rx * rx) * (y1 * y1) - (ry * ry) * (x1 * x1)) / ((rx * rx) * (y1 * y1) + (ry * ry) * (x1 * x1));
			const coef = sign * Math.sqrt(Math.max(sq, 0));
			const cx1 = coef * ((rx * y1) / ry);
			const cy1 = coef * -((ry * x1) / rx);
			const cx = (startX + endX) / 2.0 + Math.cos(xAxisRotationRad) * cx1 - Math.sin(xAxisRotationRad) * cy1;
			const cy = (startY + endY) / 2.0 + Math.sin(xAxisRotationRad) * cx1 + Math.cos(xAxisRotationRad) * cy1;
			minX = Math.min(minX, startX, endX, cx - rx, cx + rx);						// Calculate bounding box
			minY = Math.min(minY, startY, endY, cy - ry, cy + ry);
			maxX = Math.max(maxX, startX, endX, cx - rx, cx + rx);
			maxY = Math.max(maxY, startY, endY, cy - ry, cy + ry);
		}

		const size = new Size(maxX - minX, maxY - minY);
		return size;
	}

}

export const u = new Utilities();
