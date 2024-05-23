export default class MouseData {
	event: MouseEvent;
	isDouble: boolean;
	isLong: boolean;
	isDown: boolean;
	isUp: boolean;

	constructor(event: MouseEvent, isDown: boolean, isUp: boolean, isDouble: boolean, isLong: boolean) {
		this.isDouble = isDouble;
		this.isLong = isLong;
		this.isDown = isDown;
		this.event = event;
		this.isUp = isUp;
	}

	static clicks(event: MouseEvent, clickCount: number) { return new MouseData(event, false, false, clickCount > 1, false) }
	static long(event: MouseEvent) { return new MouseData(event, false, false, false, true) }
	static down(event: MouseEvent) { return new MouseData(event, true, false, false, false) }
	static up(event: MouseEvent) { return new MouseData(event, false, true, false, false) }
}
