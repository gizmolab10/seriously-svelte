declare global {
	interface String {
		hash(): number;
		lastWord(): string;
		unCamelCase(): string;
		removeWhiteSpace(): string;
		injectElipsisAt(at: number): string;
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

Object.defineProperty(String.prototype, 'removeWhiteSpace', {
	value: function(): string {
		return this.split('\n').join(' ').split('\t').join('');
	},
	writable: false,
	enumerable: false,
	configurable: false
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
	enumerable: true,
	configurable: true
});

Object.defineProperty(String.prototype, 'sizeOf_svgPath', {
	value: function(): string {
		return this.split(' ').slice(-1)[0];
	},
	writable: false,
	enumerable: false,
	configurable: false
});

declare global {
	interface Number {
		roundToEven(): number;
		normalized_angle(): number;
		toFixed(precision: number): string;
		degrees_of(precision: number): string;
		straddles_zero(other: number): boolean;
		add_angle_normalized(angle: number): number;
		normalize_between_zeroAnd(value: number): number;
		isAlmost(target: number, within: number): boolean;
		increment_by(delta: number, total: number): number;
		increment(increment: boolean, total: number): number;
		force_between(smallest: number, largest: number): number;
		increment_by_assuring(delta: number, total: number): number;
		isBetween(a: number, b: number, inclusive: boolean): boolean;
		isClocklyBetween(a: number, b: number, limit: number): boolean;
		bump_towards(smallest: number, largest: number, within: number): number;
	}
}

Object.defineProperty(Number.prototype, 'isAlmost', {
	value: function(target: number, within: number): boolean {
		return Math.abs(this - target) < within;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'force_between', {
	value: function(smallest: number, largest: number): number {
		return Math.max(smallest, Math.min(largest, this));
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'increment', {
	value: function(increase: boolean, total: number): number {
		return this.increment_by(increase ? 1 : -1, total);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'increment_by', {
	value: function(delta: number, total: number): number {
		var result = this.valueOf() + delta;
		return result.normalize_between_zeroAnd(total);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'add_angle_normalized', {
	value: function(angle: number): number {
		return (this + angle).normalized_angle();
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'straddles_zero', {
	value: function(other: number): boolean {
		const a = this.normalized_angle();
		const b = other.normalized_angle();
		const c = (Math.PI * 2) - Math.max(a, b);
		const d = Math.min(a, b);
		const e = Math.PI / 2;
		return (c < e) && (d < e);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'normalized_angle', {
	value: function(): number {
		return this.normalize_between_zeroAnd(Math.PI * 2);
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

Object.defineProperty(Number.prototype, 'roundToEven', {
	value: function(): number {
		return Math.round(this / 2) * 2;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'degrees_of', {
	value: function(precision: number): string {
		const degrees = this * 180 / Math.PI;
		return degrees.toFixed(precision);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'isClocklyBetween', {
	value: function(a: number, b: number, limit: number): boolean {
		const value = this.normalize_between_zeroAnd(limit);
		const cycled: number = value - limit;
		var min = Math.min(a, b),
			max = Math.max(a, b);
		return this.isBetween(min, max, true) || cycled.isBetween(min, max, true);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'toFixed', {
	value: function(precision: number): string {
		const formatter = new Intl.NumberFormat('en-US', {
			style: 'decimal',
			maximumFractionDigits: precision,
			minimumFractionDigits: precision
		});
		return formatter.format(this);
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'bump_towards', {
	value: function(smallest: number, largest: number, within: number): number {
		if (this < smallest || this.isAlmost(smallest, within)) {
			return smallest;
		}
		if (this > largest || this.isAlmost(largest, within)) {
			return largest;
		}
		return this;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'increment_by_assuring', {
	value: function(delta: number, total: number): number {
		var assure = Math.abs(delta);
		var value = this.valueOf();
		if (value < assure && assure != delta) {
			return 0;
		}
		var result = value + delta;
		result = Math.min(total - assure, result);
		return result;
	},
	writable: false,
	enumerable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'normalize_between_zeroAnd', {

	// converts this using clock arithmetic
	// force between 0 and value
	// or 0 or value

	value: function(value: number): number {
		let result = this;
		while (result < 0) {
			result += value;
		}
		while (result > value) {
			result -= value;
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