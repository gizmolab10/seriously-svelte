declare global {
  interface Number {
    increment(increment: boolean, length: number): number;
    isBetween(a: number, b: number, inclusive: boolean): boolean;
  }
  interface String {
    injectElipsisAt(at: number): string;
  }
}

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
//   value: function(foo: number): string {
//     return '';
//   },
//   enumerable: false, // Set enumerable to false to avoid unintended behavior
//   writable: false, // Set writable to false to prevent the method to be overwritten
//   configurable: false // Set configurable to false to prevent redefinition of the property
// });

export {};