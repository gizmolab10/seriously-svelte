class Persistence {

  constructor() {}

  writeToKey(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  readFromKey(key: string): any | null {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : null;
  }

  // Example usage
  test() {
    const key = 'myAppLastValue';
    const valueToStore = { message: 'Hello, localStorage!' };
    this.writeToKey(key, valueToStore);
    const retrievedValue = this.readFromKey(key);

    if (retrievedValue !== null) {
      console.log('Retrieved Value:', retrievedValue);
    } else {
      console.log('No value found in localStorage.');
    }
  }

}

export const persistence = new Persistence();
