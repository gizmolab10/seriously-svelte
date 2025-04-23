import type { Dictionary } from './Types';

export default class E_Array<T, D extends Dictionary<any>> {
	private enums: { [key: string]: number };
	private array: T[];

	static create<D extends Dictionary<any>>(dictionary: D) {
		// Proxy handler to intercept property access
		return new Proxy(new E_Array(dictionary), {
			get: (target, prop) => {
				return target.get(target, prop as string);
			},
		});
	}

	constructor(private dictionary: D) {
		this.enums = this.createEnumFromDictionary(dictionary);
		this.array = Object.values(dictionary);
	}

	private createEnumFromDictionary(dictionary: D): { [key: string]: number } {
		// Create an enum-like object from the dictionary keys
		const enumObject: { [key: string]: number } = {};
		let index = 0;

		for (const key in dictionary) {
			enumObject[key] = index++;
		}

		return enumObject;
	}

	get(target: any, prop: string) {
		// Intercept direct property access and map it to array index
		if (prop in target.enums) {
			const index = target.enums[prop];
			return target.array[index];
		}
		return undefined;
	}

}

// Example usage:

// Sample dictionary
// const myDict = {
//	 first: 'apple',
//	 second: 'banana',
//	 third: 'cherry',
// };

// const eArray = E_Array.create(myDict);

// // Access array values directly via property names
// console.log(eArray.first);	 // Output: 'apple'
// console.log(eArray.second);	// Output: 'banana'
// console.log(eArray.third);	 // Output: 'cherry'

