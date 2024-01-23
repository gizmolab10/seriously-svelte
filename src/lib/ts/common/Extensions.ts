declare global {
	interface Number {
		increment(increment: boolean, length: number): number;
		isBetween(a: number, b: number, inclusive: boolean): boolean;
	}
	interface String {
		injectElipsisAt(at: number): string;
		asyncHash(): Promise<number>;
		hash(): number;
	}
}
// Async hash function
Object.defineProperty(String.prototype, 'asyncHash', {
  value: function() {
    return new Promise(async (resolve, reject) => {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(this);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        resolve(parseInt(hashHex.substring(0, 15), 16));
      } catch (error) {
        console.error('Error in asyncHash:', error);
        reject(error);
      }
    });
  },
  writable: true,
  configurable: true
});

// Sync hash function (note: this is not truly synchronous)
Object.defineProperty(String.prototype, 'hash', {
  value: function() {
    let result = null;
    this.asyncHash().then(value => { result = value;});
	if (!result) {
		console.log('null hash');
	}
    return result;
  },
  writable: true,
  configurable: true
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
	enumerable: false,
	writable: false,
	configurable: false
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
	enumerable: false,
	writable: false,
	configurable: false
});

Object.defineProperty(Number.prototype, 'isBetween', {
	value: function(a: number, b: number, inclusive: boolean): boolean {
		var min = Math.min(a, b),
			max = Math.max(a, b);

		return inclusive ? this >= min && this <= max : this > min && this < max;
	},
	enumerable: false,
	writable: false,
	configurable: false
});

// Object.defineProperty(String.prototype, 'boilerplate', {
//	value: function(foo: number): string {
//		return '';
//	},
//	enumerable: false, // Set enumerable to false to avoid unintended behavior
//	writable: false, // Set writable to false to prevent the method to be overwritten
//	configurable: false // Set configurable to false to prevent redefinition of the property
// });

export {};