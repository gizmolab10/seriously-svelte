// N.B., do not import these from Global Imports --> avoid dependency issues when importing Utilities class into test code

import Identifiable from '../runtime/Identifiable';
import { E_Browser } from './Enumerations';
import type { Dictionary } from './Types';
import { E_Quadrant } from './Angle';
import { Point } from './Geometry';
import Angle from './Angle';

export class Testworthy_Utilities {
	private orderedKeysCache = new WeakMap<object, string[]>();

	ignore(event: Event)												 {}
	onNextCycle_apply(closure: () => {})								 { setTimeout(() => { closure(); }, 0); }
	location_ofMouseEvent(event: MouseEvent):					   Point { return new Point(event.clientX, event.clientY); }
	quadrant_ofAngle(angle: number):						  E_Quadrant { return new Angle(angle).quadrant_ofAngle; }
	concatenateArrays(a: Array<any>, b: Array<any>):		  Array<any> { return [...a, ...b]; }
	strip_falsies(array: Array<any>):						  Array<any> { return array.filter(a => !!a); }
	subtract_arrayFrom(a: Array<any>, b: Array<any>):		  Array<any> { return b.filter(c => a.filter(d => c != d)); }
	uniquely_concatenateArrays(a: Array<any>, b: Array<any>): Array<any> { return this.strip_invalid(this.concatenateArrays(a, b)); }
	strip_invalid(array: Array<any>):						  Array<any> { return this.strip_identifiableDuplicates(this.strip_falsies(array)); }

	// remove item from a dictionary (with string keys and number values) at the index
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

	basis_angle_ofType_Quadrant(quadrant: E_Quadrant): number {
		switch (quadrant) {
			case E_Quadrant.upperRight: return Angle.three_quarters;
			case E_Quadrant.lowerLeft:  return Angle.quarter;
			case E_Quadrant.upperLeft:  return Angle.half;
			default:					return 0;
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

	get browserType(): E_Browser {
		const userAgent: string = navigator.userAgent;
		switch (true) {
			case /msie (\d+)/i.test(userAgent) ||
				/trident\/.*; rv:(\d+)/i.test(userAgent):  return E_Browser.explorer;
			case /(chrome|crios)\/(\d+)/i.test(userAgent): return E_Browser.chrome;
			case /firefox\/(\d+)/i.test(userAgent):		   return E_Browser.firefox;
			case /opr\/(\d+)/i.test(userAgent):			   return E_Browser.opera;
			case /orion\/(\d+)/i.test(userAgent):		   return E_Browser.orion;
			case /safari\/(\d+)/i.test(userAgent):		   return E_Browser.safari;
			default:									   return E_Browser.unknown
		}
	}

	static readonly JSON: unique symbol;

	stringify_object(object: Object): string {
		const ignored = [
			'hid',
			'state',
			'idBase',
			'hidChild',
			'hidParent',
			'isGrabbed',
			'bulkRootID',
			'e_database',
			'persistence',
			'selectionRange',
		];
		function removeExtras(key: string, value: any): any | undefined {
			if (ignored.includes(key)) {
				return undefined;
			}
			return value;
		}
		return JSON.stringify(object, removeExtras, 2);
	}

	

}

export const tu = new Testworthy_Utilities();
