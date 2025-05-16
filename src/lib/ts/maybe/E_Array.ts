import type { Dictionary } from './Types';

export default class T_Array<T, D extends Dictionary<T>> {
	private enums: Dictionary<T>;
	private array: T[];
	private changeListeners: Set<(key: string, oldValue: T, newValue: T) => void>;

	static create<D extends Dictionary<T>>(dictionary: D) {
		// Proxy handler to intercept property access
		return new Proxy(new T_Array(dictionary), {
			get: (target, prop) => {
				return target.get(target, prop as string);
			},
			set: (target, prop, value) => {
				return target.set(target, prop as string, value);
			}
		});
	}

	constructor(private dictionary: D) {
		this.enums = this.createEnumFromDictionary(dictionary);
		this.array = Object.values(dictionary);
		this.changeListeners = new Set();
	}

	private createEnumFromDictionary(dictionary: D): Dictionary<T> {
		// Create an enum-like object from the dictionary keys
		const enumObject: Dictionary<T> = {};
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

	set(target: any, prop: string, value: T): boolean {
		if (prop in target.enums) {
			const index = target.enums[prop];
			const oldValue = target.array[index];
			target.array[index] = value;
			
			// Notify all listeners about the change
			target.changeListeners.forEach(listener => {
				listener(prop, oldValue, value);
			});
			
			return true;
		}
		return false;
	}

	// Add a change listener
	onChange(listener: (key: string, oldValue: T, newValue: T) => void): void {
		this.changeListeners.add(listener);
	}

	// Remove a change listener
	removeChangeListener(listener: (key: string, oldValue: T, newValue: T) => void): void {
		this.changeListeners.delete(listener);
	}

	// Clear all change listeners
	clearChangeListeners(): void {
		this.changeListeners.clear();
	}
}

// Example usage:

// Sample dictionary
// const myDict = {
//	 first: 'apple',
//	 second: 'banana',
//	 third: 'cherry',
// };

// const eArray = T_Array.create(myDict);

// // Add a change listener
// eArray.onChange((key, oldValue, newValue) => {
//	 console.log(`Value changed for ${key}: ${oldValue} -> ${newValue}`);
// });

// // Access array values directly via property names
// console.log(eArray.first);	 // Output: 'apple'
// console.log(eArray.second);	// Output: 'banana'
// console.log(eArray.third);	 // Output: 'cherry'

// // Change a value
// eArray.first = 'orange';	 // Will trigger the change listener

