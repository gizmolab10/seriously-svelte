export default class MouseData {
	element: HTMLElement;
	isDouble: boolean;
	isLong: boolean;
	isDown: boolean;
	isUp: boolean;

	constructor(element: HTMLElement, isDown: boolean, isUp: boolean, isDouble: boolean, isLong: boolean) {
		this.isDouble = isDouble;
		this.element = element;
		this.isLong = isLong;
		this.isDown = isDown;
		this.isUp = isUp;
	}

	static clicks(element: HTMLElement, clickCount: number) { return new MouseData(element, false, false, clickCount > 1, false) }
	static long(element: HTMLElement) { return new MouseData(element, false, false, false, true) }
	static down(element: HTMLElement) { return new MouseData(element, true, false, false, false) }
	static up(element: HTMLElement) { return new MouseData(element, false, true, false, false) }
}
