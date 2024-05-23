export default class MouseData {
	isDouble: boolean;
	isLong: boolean;
	isDown: boolean;
	isUp: boolean;
	event: Event;

	constructor(event: Event, isDown: boolean, isUp: boolean, isDouble: boolean, isLong: boolean) {
		this.isDouble = isDouble;
		this.isLong = isLong;
		this.isDown = isDown;
		this.event = event;
		this.isUp = isUp;
	}

	static clicks(event: Event, clickCount: number) { return new MouseData(event, false, false, clickCount > 1, false) }
	static long(event: Event) { return new MouseData(event, false, false, false, true) }
	static down(event: Event) { return new MouseData(event, true, false, false, false) }
	static up(event: Event) { return new MouseData(event, false, true, false, false) }
}
