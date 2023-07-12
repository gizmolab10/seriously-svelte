declare global {
  interface Number {
    increment(increment: boolean, max: number): number;
  }
}

Object.defineProperty(Number.prototype, 'increment', {
  value: function(increment: boolean, max: number): number {
    var result = this.valueOf() + (increment ? 1 : -1);
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

export {};