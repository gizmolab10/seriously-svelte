// N.B., do not import these from Global Imports --> avoid dependency issues when importing Utilities class into test code

import Identifiable from '../runtime/Identifiable';
import { T_Browser } from './Enumerations';
import type { Dictionary } from './Types';
import MobileDetect from 'mobile-detect';
import { T_Quadrant } from './Angle';
import { Point } from './Geometry';
import Angle from './Angle';

export class Testworthy_Utilities {
	private orderedKeysCache = new WeakMap<object, string[]>();

	ignore(event: Event)							{}
	onNextCycle_apply(closure: () => {})			{ setTimeout(() => { closure(); }, 0); }
	quadrant_ofAngle(angle: number):	 T_Quadrant { return new Angle(angle).quadrant_ofAngle; }
	location_ofMouseEvent(event: MouseEvent): Point { return new Point(event.clientX, event.clientY); }

	get device_isMobile(): boolean {
		const md = new MobileDetect(window.navigator.userAgent);
		return !!md.mobile();
	}

	// remove item from a dictionary at the index
	// assuming it has string keys and number values
	valueFrom_atIndex<T extends Record<string, number>>(dictionary: T, index: number): number {
		const propNames = Object.keys(dictionary) as Array<keyof T>;
		if (index < 0 || index >= propNames.length) {
			throw new Error(`Index ${index} is out of bounds`);
		}
		return dictionary[propNames[index]];
	}

	valueFrom_atIndex_usingMap<T extends Record<string, number>>(dictionary: T, index: number): number {
		// Get or create the ordered keys for this dictionary
		let orderedKeys = this.orderedKeysCache.get(dictionary);
		if (!orderedKeys) {
			orderedKeys = Object.keys(dictionary);
			this.orderedKeysCache.set(dictionary, orderedKeys);
		}

		if (index < 0 || index >= orderedKeys.length) {
			throw new Error(`Index ${index} is out of bounds`);
		}
		return dictionary[orderedKeys[index] as keyof T];
	}

	remove<T>(from: Array<T>, item: T): Array<T> {
		let array = from;
		const index = array.findIndex((element: T) => element === item);
		if (index !== -1) {
			array.splice(index, 1);
		}
		return array;
	}

	assure_forKey_inDict<T>(key: string, dict: Dictionary, closure: () => T): T {
		let result = dict[key];
		if (!result) {
			result = closure();
			if (!!result) {
				dict[key] = result;
			}
		}
		return result;
	}

	copyObject(obj: any): any {
		const copiedObject = Object.create(Object.getPrototypeOf(obj));
		Object.assign(copiedObject, obj);
		return copiedObject;
	}

	basis_angle_ofType_Quadrant(quadrant: T_Quadrant): number {
		switch (quadrant) {
			case T_Quadrant.upperRight: return Angle.three_quarters;
			case T_Quadrant.lowerLeft:  return Angle.quarter;
			case T_Quadrant.upperLeft:  return Angle.half;
			default:					return 0;
		}
	}

	convertToObject(instance: any, fields: string[]): object {
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

	get browserType(): T_Browser {
		const userAgent: string = navigator.userAgent;
		switch (true) {
			case /msie (\d+)/i.test(userAgent) ||
				/trident\/.*; rv:(\d+)/i.test(userAgent):  return T_Browser.explorer;
			case /(chrome|crios)\/(\d+)/i.test(userAgent): return T_Browser.chrome;
			case /firefox\/(\d+)/i.test(userAgent):		   return T_Browser.firefox;
			case /opr\/(\d+)/i.test(userAgent):			   return T_Browser.opera;
			case /orion\/(\d+)/i.test(userAgent):		   return T_Browser.orion;
			case /safari\/(\d+)/i.test(userAgent):		   return T_Browser.safari;
			default:									   return T_Browser.unknown
		}
	}

	static readonly _____ARRAYS: unique symbol;

	concatenateArrays(a: Array<any>, b: Array<any>):  Array<any> { return [...a, ...b]; }
	strip_falsies(array: Array<any>):				  Array<any> { return array.filter(a => !!a); }
	subtract_arrayFrom(a: Array<any>, b: Array<any>): Array<any> { return b.filter(c => a.filter(d => c != d)); }
	strip_invalid(array: Array<any>):				  Array<any> { return this.strip_duplicates(this.strip_falsies(array)); }
	uniquely_concatenateArrays(a: Array<any>, b: Array<any>): Array<any> { return this.strip_duplicates(this.concatenateArrays(a, b)); }

	remove_fromArray_byReference<T>(item: T, array: Array<T>): Array<T> {
		if (!item) return array;
		return array.filter(element => element !== item);
	}

	indexOf_inArray_byReference<T>(item: T, array: Array<T>): number {
		if (!item) return -1;
		return array.findIndex(element => element === item);
	}

	strip_duplicates(array: Array<any>): Array<any> {
		let stripped: Array<any> = [];
		for (const item of array) {
			if (!stripped.includes(item)) {
				stripped.push(item);
			}
		}
		return stripped;
	}

	static readonly _____ARRAYS_OF_IDENTIFIABLES: unique symbol;

	strip_invalid_Identifiables(array: Array<Identifiable>): Array<Identifiable> { return this.strip_identifiableDuplicates(this.strip_falsies(array)); }
	uniquely_concatenateArrays_ofIdentifiables(a: Array<Identifiable>, b: Array<Identifiable>): Array<Identifiable> { return this.strip_invalid_Identifiables(this.concatenateArrays(a, b)); }

	remove_fromArray<T extends Identifiable>(item: T, array: Array<T>): Array<T> {
		if (!item) return array;
		return array.filter(element => element.id !== item.id);
	}

	indexOf_inArray<T extends Identifiable>(item: T, array: Array<T>): number {
		if (!item) return -1;
		return array.findIndex(element => element.id === item.id);
	}

	strip_identifiableDuplicates(identifiables: Array<Identifiable>): Array<Identifiable> {
		let identifiablesByHID: {[hash: number]: Identifiable} = {};
		let stripped: Array<Identifiable> = [];
		for (const identifiable of identifiables) {
			const hid = identifiable.hid;
			if ((!!hid || hid == 0) && (!identifiablesByHID[hid])) {
				identifiablesByHID[hid] = identifiable;
				stripped.push(identifiable);
			}
		}
		return stripped;
	}

	static readonly _____JSON: unique symbol;

	stringify_object(object: Object): string {
		const ignored = [
			'hid',
			'state',
			'idBase',
			'hidChild',
			'hidParent',
			'isGrabbed',
			'bulkRootID',
			't_database',
			'persistence',
			'selectionRange',
		];
		function removeExtras(key: string, value: any): any | undefined {
			if (ignored.includes(key)) {
				return undefined;
			}
			return value;
		}
		return JSON.stringify(object, removeExtras, 1);
	}

	/**
	 * Returns the cumulative sum (prefix sum) array for the input array.
	 * Example: [10, 20, 30] => [10, 30, 60]
	 */
	cumulativeSum(array: number[]): number[] {
		const result: number[] = [];
		array.reduce((acc, val) => {
			const sum = acc + val;
			result.push(sum);
			return sum;
		}, 0);
		return result;
	}

}

export const tu = new Testworthy_Utilities();
