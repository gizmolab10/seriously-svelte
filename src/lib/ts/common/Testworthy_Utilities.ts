// N.B., do not import these from Global Imports --> avoid dependency issues when importing Utilities class

import Identifiable from '../runtime/Identifiable';
import { T_Browser } from './Enumerations';
import type { Dictionary } from './Types';
import { T_Quadrant } from './Angle';
import { Point } from './Geometry';
import Angle from './Angle';

export class Testworthy_Utilities {
	ignore(event: Event)												 {}
	onNextCycle_apply(closure: () => {})								 { setTimeout(() => { closure(); }, 0); }
	location_ofMouseEvent(event: MouseEvent):					   Point { return new Point(event.clientX, event.clientY); }
	quadrant_ofAngle(angle: number):						  T_Quadrant { return new Angle(angle).quadrant_ofAngle; }
	concatenateArrays(a: Array<any>, b: Array<any>):		  Array<any> { return [...a, ...b]; }
	strip_falsies(array: Array<any>):						  Array<any> { return array.filter(a => !!a); }
	subtract_arrayFrom(a: Array<any>, b: Array<any>):		  Array<any> { return b.filter(c => a.filter(d => c != d)); }
	uniquely_concatenateArrays(a: Array<any>, b: Array<any>): Array<any> { return this.strip_invalid(this.concatenateArrays(a, b)); }
	strip_invalid(array: Array<any>):						  Array<any> { return this.strip_identifiableDuplicates(this.strip_falsies(array)); }

	copyObject(obj: any): any {
		const copiedObject = Object.create(Object.getPrototypeOf(obj));
		Object.assign(copiedObject, obj);
		return copiedObject;
	}

	valueFrom_atIndex<T extends Record<string, number>>(object: T, index: number): number {
		const propNames = Object.keys(object) as Array<keyof T>;
		if (index < 0 || index >= propNames.length) {
			throw new Error(`Index ${index} is out of bounds`);
		}
		return object[propNames[index]];
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

	basis_angle_ofType_Quadrant(quadrant: T_Quadrant): number {
		switch (quadrant) {
			case T_Quadrant.upperRight: return Angle.three_quarters;
			case T_Quadrant.lowerLeft:  return Angle.quarter;
			case T_Quadrant.upperLeft:  return Angle.half;
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
		return JSON.stringify(object, removeExtras, 2);
	}

	

}

export const tu = new Testworthy_Utilities();
