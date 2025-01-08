// N.B., do not import these from Global Imports --> avoid dependency issues when importing Utilities class

import { s_thing_fontFamily } from '../state/Svelte_Stores';
import { Size, Point } from '../geometry/Geometry';
import type { Dictionary } from '../common/Types';
import Identifiable from '../basis/Identifiable';
import { Quadrant } from '../geometry/Angle';
import Ancestry from '../managers/Ancestry';
import { IDBrowser } from './Enumerations';
import { transparentize } from 'color2k';
import Angle from '../geometry/Angle';
import { get } from 'svelte/store';
import { k } from './Constants';

class Utilities {
	ignore(event: Event) {}
	location_ofMouseEvent(event: MouseEvent):					   Point { return new Point(event.clientX, event.clientY); }
	getWidthOf(s: string):										  number { return this.getWidth_ofString_withSize(s, `${k.font_size}px`); }
	opacitize(color: string, amount: number):					  string { return transparentize(color, 1 - amount); }
	quadrant_ofAngle(angle: number):							Quadrant { return new Angle(angle).quadrant_ofAngle; }
	concatenateArrays(a: Array<any>, b: Array<any>):		  Array<any> { return [...a, ...b]; }
	strip_falsies(array: Array<any>):						  Array<any> { return array.filter(a => !!a); }
	subtract_arrayFrom(a: Array<any>, b: Array<any>):		  Array<any> { return b.filter(c => a.filter(d => c != d)); }
	uniquely_concatenateArrays(a: Array<any>, b: Array<any>): Array<any> { return this.strip_invalid(this.concatenateArrays(a, b)); }
	strip_invalid(array: Array<any>):						  Array<any> { return this.strip_identifiableDuplicates(this.strip_falsies(array)); }
	sort_byOrder(array: Array<Ancestry>):				 Array<Ancestry> { return array.sort( (a: Ancestry, b: Ancestry) => { return a.order - b.order; }); }

	copyObject(obj: any): any {
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

	sort_byTitleTop(ancestries: Array<Ancestry>): Array<Ancestry> {
		return ancestries.sort( (a: Ancestry, b: Ancestry) => {
			const aTop = a.titleRect?.origin.y;
			const bTop = b.titleRect?.origin.y;
			return (!aTop || !bTop) ? 0 : aTop - bTop;
		});
	}

	strip_hidDuplicates(ancestries: Array<Ancestry>): Array<Ancestry> {
		let ancestriesByHID: {[hash: number]: Ancestry} = {};
		let stripped: Array<Ancestry> = [];
		for (const ancestry of ancestries) {
			const hid = ancestry.idHashed;
			if ((!!hid || hid == 0) && (!ancestriesByHID[hid])) {
				ancestriesByHID[hid] = ancestry;
				stripped.push(ancestry);
			}
		}
		return stripped;
	}

	strip_identifiableDuplicates(identifiables: Array<Identifiable>): Array<Identifiable> {
		let identifiablesByHID: {[hash: number]: Identifiable} = {};
		let stripped: Array<Identifiable> = [];
		for (const identifiable of identifiables) {
			const hid = identifiable.idHashed;
			if ((!!hid || hid == 0) && (!identifiablesByHID[hid])) {
				identifiablesByHID[hid] = identifiable;
				stripped.push(identifiable);
			}
		}
		return stripped;
	}

	strip_thingDuplicates_from(ancestries: Array<Ancestry>): Array<Ancestry> {
		let ancestriesByHID: {[hash: number]: Ancestry} = {};
		let stripped: Array<Ancestry> = [];
		for (const ancestry of ancestries) {
			const hid = ancestry.thing?.id.hash();
			if ((!!hid || hid == 0) && (!ancestriesByHID[hid])) {
				ancestriesByHID[hid] = ancestry;
				stripped.push(ancestry);
			}
		}
		return stripped;
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
		const o: Dictionary = {};
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

	ancestries_orders_normalize_persistentMaybe(array: Array<Ancestry>, persist: boolean = true): void {
		this.sort_byOrder(array);
		array.forEach( (ancestry, index) => {
			if (ancestry.order != index) {
				const relationship = ancestry.relationship;
				relationship?.order_setTo_persistentMaybe(index, persist);
			}
		});
	}

	getWidth_ofString_withSize(s: string, fontSize: string): number {
		const element: HTMLElement = document.createElement('div');
		element.style.fontFamily = get(s_thing_fontFamily);
		element.style.left = '-9999px'; // offscreen
		element.style.padding = '0px 0px 0px 0px';
		element.style.position = 'absolute';
		element.style.fontSize = fontSize;
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

	static readonly JSON: unique symbol;

	stringify_object(object: Object): string {
		const extras = [
			'dbType',
			'baseID',
			'isDirty',
			'idHashed',
			'hidChild',
			'hidParent',
			'isEditing',
			'isGrabbed',
			'bulkRootID',
			'oneAncestry',
			'page_states',
			'needsBulkFetch',
			'selectionRange',
			'lastModifyDate',
			'awaitingCreation',
			'already_persisted',
			'hasPersistentStorage',
		];
		function removeExtras(key: string, value: any): any | undefined {
			if (extras.includes(key)) {
				return undefined;
			}
			return value;
		}
		return JSON.stringify(object, removeExtras, 2);
	}

	

}

export const u = new Utilities();
