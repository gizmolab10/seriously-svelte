// N.B., do not import these from Global Imports --> avoid dependency issues when importing Utilities class

import { Testworthy_Utilities } from './Testworthy_Utilities';
import { w_t_database, w_thing_fontFamily } from './Stores';
import Identifiable from '../runtime/Identifiable';
import Ancestry from '../runtime/Ancestry';
import type { Dictionary } from './Types';
import { w } from '../layout/G_Window';
import { Point } from './Geometry';
import { get } from 'svelte/store';
import { k } from './Constants';
import Angle from './Angle';

export class Utilities extends Testworthy_Utilities {
	
	getWidthOf(s: string):								number { return this.getWidth_ofString_withSize(s, `${k.font_size.common}px`); }
	sort_byOrder(ancestries: Array<Ancestry>): Array<Ancestry> { return ancestries.sort( (a: Ancestry, b: Ancestry) => { return a.order - b.order; }); }

	getFontOf(element: HTMLElement): string {
		const style: CSSStyleDeclaration = window.getComputedStyle(element);
		const fontFamily: string = style.fontFamily;
		const fontSize: string = style.fontSize;
		return `${fontSize} ${fontFamily}`;
	}

	indexOf_withMatchingThingID_in(ancestry: Ancestry, ancestries: Array<Ancestry>): number {
		const thing = ancestry.thing;
		if (!!thing) {
			const index = ancestries.findIndex(a => a.thing?.id == thing.id);
			return index;
		}
		return -1;
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
			const hid = ancestry.hid;
			if ((!!hid || hid == 0) && (!ancestriesByHID[hid])) {
				ancestriesByHID[hid] = ancestry;
				stripped.push(ancestry);
			}
		}
		return stripped;
	}

	strip_identifiableDuplicates(identifiables: Array<Identifiable>): Array<Identifiable> {
		let stripped: Array<Identifiable> = [];
		for (const identifiable of identifiables) {
			const hid = identifiable.hid;
			if ((!!hid || hid == 0)) {
				const index = stripped.findIndex(i => i.hid === hid);
				if (index == -1) {
					stripped.push(identifiable);
				} else if (stripped[index].hid < identifiable.hid) {
					stripped[index] = identifiable;		// assure array content is repeatable
				}
			}
		}
		return stripped;
	}

	strip_thingDuplicates_from(ancestries: Array<Ancestry>): Array<Ancestry> {
		let stripped: Array<Ancestry> = [];
		for (const ancestry of ancestries) {
			const hid = ancestry.thing?.hid;
			if ((!!hid || hid == 0)) {
				const index = stripped.findIndex(a => a.thing?.hid === hid);
				if (index == -1) {
					stripped.push(ancestry);
				} else if (stripped[index].depth < ancestry.depth) {
					stripped[index] = ancestry;		// assure array content is repeatable
				}
			}
		}
		return stripped;
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

	ids_forDB(array: Array<Ancestry>): Array<string> {
		return array.filter(a => a.t_database == get(w_t_database)).map(a => a.id);
	}

	ancestries_orders_normalize(ancestries: Array<Ancestry>, persist: boolean = false): void {
		const length = ancestries.length;
		if (length > 1) {
			this.sort_byOrder(ancestries);
			for (let index = 0; index < length; index++) {
				ancestries[index].order_setTo(index, persist);
			}
		}
	}

	getWidth_ofString_withSize(s: string, fontSize: string): number {
		const element: HTMLElement = document.createElement('div');
		element.style.fontFamily = get(w_thing_fontFamily);
		element.style.left = '-9999px'; // offscreen
		element.style.padding = '0px 0px 0px 0px';
		element.style.position = 'absolute';
		element.style.fontSize = fontSize;
		element.style.whiteSpace = 'pre';
		element.textContent = s;
		document.body.appendChild(element);
		const width: number = element.getBoundingClientRect().width / w.scale_factor;
		document.body.removeChild(element);
		return width;
	}

	convert_windowOffset_toCharacterOffset_in(offset: number, input: HTMLInputElement): number {
		const rect = input.getBoundingClientRect();
		const style = window.getComputedStyle(input);
		const paddingLeft = parseFloat(style.paddingLeft) || 0;
		const borderLeft = parseFloat(style.borderLeftWidth) || 0;
		const contentLeft = rect.left + borderLeft + paddingLeft;
		let relativeX = offset - contentLeft;
		if (relativeX < 0) {
			relativeX = 0;
		}
		const effectiveX = (relativeX + input.scrollLeft) / w.scale_factor;
		// Create a canvas context for measuring text.
		const canvas = document.createElement('canvas');
		const context = canvas.getContext('2d');
		if (!context) {
			return 0;
		}
		context.font = style.font || `${style.fontSize} ${style.fontFamily}`;
		const text = input.value;
		if (text.length === 0) {
			return 0;
		}
		// Use binary search to find the character index
		// whose measured width is as close as possible to effectiveX.
		let low = 0;
		let high = text.length;
		while (low < high) {
			const mid = Math.floor((low + high) / 2);
			const width = context.measureText(text.substring(0, mid)).width;
			if (width < effectiveX) {
				low = mid + 1;
			} else {
				high = mid;
			}
		}
		// low is now the smallest index where the width is >= effectiveX.
		// Optionally, check if the previous index was closer.
		if (low > 0) {
			const prevWidth = context.measureText(text.substring(0, low - 1)).width;
			const currWidth = context.measureText(text.substring(0, low)).width;
			if (Math.abs(effectiveX - prevWidth) < Math.abs(currWidth - effectiveX)) {
				return low - 1;
			}
		}
		return low;
	}

	remove_fromArray<T extends Identifiable>(item: T, array: Array<T>): Array<T> {
		if (!item) return array;
		return array.filter(element => element.id !== item.id);
	}

	remove_fromArray_byReference<T>(item: T, array: Array<T>): Array<T> {
		if (!item) return array;
		return array.filter(element => element !== item);
	}

	indexOf_inArray<T extends Identifiable>(item: T, array: Array<T>): number {
		if (!item) return -1;
		return array.findIndex(element => element.id === item.id);
	}

	indexOf_inArray_byReference<T>(item: T, array: Array<T>): number {
		if (!item) return -1;
		return array.findIndex(element => element === item);
	}

}

export const u = new Utilities();
