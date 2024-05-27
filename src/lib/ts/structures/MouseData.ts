export default class MouseData {
	element: HTMLElement;
	event: Event | null;
	isDouble: boolean;
	isHover: boolean;
	isLong: boolean;
	isDown: boolean;
	isOut: boolean;
	isUp: boolean;

	constructor(event: Event | null, element: HTMLElement, isHover: boolean, isOut: boolean, isDown: boolean, isUp: boolean, isDouble: boolean, isLong: boolean) {
		this.isDouble = isDouble;
		this.element = element;
		this.isHover = isHover;
		this.isLong = isLong;
		this.isDown = isDown;
		this.isOut = isOut;
		this.event = event;
		this.isUp = isUp;
	}

	static up(event: Event | null, element: HTMLElement) { return new MouseData(event, element, false, false, false, true, false, false); }
	static down(event: Event | null, element: HTMLElement) { return new MouseData(event, element, false, false, true, false, false, false); }
	static long(event: Event | null, element: HTMLElement) { return new MouseData(event, element, false, false, false, false, false, true); }
	static hover(event: Event | null, element: HTMLElement, isHovering: boolean) { return new MouseData(event, element, true, !isHovering, false, false, false, false); }
	static clicks(event: Event | null, element: HTMLElement, clickCount: number) { return new MouseData(event, element, false, false, false, false, clickCount > 1, false); }
}
