declare global {
	interface Number {
		normalize(value: number): number;
		add_angle_normalized(angle: number): number;
		increment(increment: boolean, length: number): number;
		isBetween(a: number, b: number, inclusive: boolean): boolean;
		isClocklyBetween(a: number, b: number, limit: number): boolean;
	}
	interface String {
		injectElipsisAt(at: number): string;
		unCamelCase(): string;
		lastWord(): string;
		hash(): number;
	}
}

Object.defineProperty(String.prototype, 'unCamelCase', {
	value: function(): string {
		return this.replace(/([A-Z])/g, ' $1').toLowerCase();
	},
	writable: false, // Set writable to false to prevent the method to be overwritten
	enumerable: false, // Set enumerable to false to avoid unintended behavior
	configurable: false // Set configurable to false to prevent redefinition of the property
});

Object.defineProperty(String.prototype, 'lastWord', {
	value: function(): string {
		return this.split(' ').slice(-1)[0];
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(String.prototype, 'injectElipsisAt', {
	value: function(at: number = 7): string {
		let injected = this;
		const length = injected.length;
		if (length > (at * 2) + 3) {
			injected = injected.slice(0, at) + ' ... ' + injected.slice(length - at, length);
		}
		return injected;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

// Sync hash function (note: this is not truly synchronous)
Object.defineProperty(String.prototype, 'hash', {
	value: function() {
		var hash = 0,
		i, chr;
		if (this.length === 0) {
			return hash;
		}
		for (i = 0; i < this.length; i++) {
			chr = this.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}
		return hash;
	},
	writable: true,
	configurable: true
});

Object.defineProperty(Number.prototype, 'increment', {
	value: function(increase: boolean, length: number): number {
		var result = this.valueOf() + (increase ? 1 : -1);
		const max = length - 1;
		if (result > max) {
			result = 0;
		} else if (result < 0) {
			result = max;
		}
		return result;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'add_angle_normalized', {
	value: function(angle: number): number {
		return (Math.PI * 2).normalize(this + angle);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'isBetween', {
	value: function(a: number, b: number, inclusive: boolean): boolean {
		const min = Math.min(a, b),
			  max = Math.max(a, b);
		return inclusive ? (this >= min && this <= max) : (this > min && this < max);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'isClocklyBetween', {
	value: function(a: number, b: number, limit: number): boolean {
		const value = limit.normalize(this)
		const cycled: number = value - limit;
		var min = Math.min(a, b),
			max = Math.max(a, b);
		return this.isBetween(min, max, true) || cycled.isBetween(min, max, true);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'normalize', {
	value: function(value: number): number {
		let result = value;
		while (result < 0) {
			result += this;
		}
		while (result > this) {
			result -= this;
		}
		return result;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

// Object.defineProperty(String.prototype, 'boilerplate', {
//	value: function(foo: number): string {
//		return k.empty;
//	},
//	enumerable: false, // Set enumerable to false to avoid unintended behavior
//	writable: false, // Set writable to false to prevent the method to be overwritten
//	configurable: false // Set configurable to false to prevent redefinition of the property
// });

export {};