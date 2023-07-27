declare global {
  interface Number {
    increment(increment: boolean, length: number): number;
    between(a: number, b: number, inclusive: boolean): boolean;
  }
  interface String {
    injectElipsisAt(at: number): string;
  }
}

Object.defineProperty(String.prototype, 'injectElipsisAt', {
  value: function(at: number): string {
    let injected = this;
    const length = injected.length;
    if (length > (at * 2) + 3) {
      injected = injected.slice(0, at) + ' ... ' + injected.slice(length - at, length);
    }
    return injected;
  },
  enumerable: false, // Set enumerable to false to avoid unintended behavior
  writable: false, // Set writable to false to prevent the method to be overwritten
  configurable: false // Set configurable to false to prevent redefinition of the property
});

Object.defineProperty(Number.prototype, 'increment', {
  value: function(increment: boolean, length: number): number {
    var result = this.valueOf() + (increment ? 1 : -1);
    const max = length - 1;
    if (result > max) {
      result = 0;
    } else if (result < 0) {
      result = max;
    }
    return result;
  },
  enumerable: false, // Set enumerable to false to avoid unintended behavior
  writable: false, // Set writable to false to prevent the method to be overwritten
  configurable: false // Set configurable to false to prevent redefinition of the property
});

Object.defineProperty(Number.prototype, 'between', { 
  value: function(a: number, b: number, inclusive: boolean): boolean {
    var min = Math.min(a, b),
      max = Math.max(a, b);

    return inclusive ? this >= min && this <= max : this > min && this < max;
  },
  enumerable: false, // Set enumerable to false to avoid unintended behavior
  writable: false, // Set writable to false to prevent the method to be overwritten
  configurable: false // Set configurable to false to prevent redefinition of the property
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