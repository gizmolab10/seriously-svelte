export default class Mouse_State {
	element: HTMLElement | null;	// null means mouse responder
	event: Event | null;			// null means mouse movement from global state
	isDouble: boolean;
	isHover: boolean;
	isLong: boolean;
	isDown: boolean;
	isOut: boolean;
	isUp: boolean;
	clicks = 0;

	//////////////////////////////////////////////////
	//	encapsulate relevant event properties		//
	//	that buttons and widgets pay attention to	//
	//	isOut is also reflected in ElementState		//
	//////////////////////////////////////////////////

	constructor(event: Event | null, element: HTMLElement | null, isHover: boolean, isOut: boolean, isDown: boolean, isUp: boolean, isDouble: boolean, isLong: boolean) {
		this.isDouble = isDouble;
		this.element = element;
		this.isHover = isHover;
		this.isLong = isLong;
		this.isDown = isDown;
		this.isOut = isOut;
		this.event = event;
		this.isUp = isUp;
	}

	static empty() { return new Mouse_State(null, null, false, false, false, true, false, false); }
	static up(event: Event | null, element: HTMLElement) { return new Mouse_State(event, element, false, false, false, true, false, false); }
	static down(event: Event | null, element: HTMLElement) { return new Mouse_State(event, element, false, false, true, false, false, false); }
	static long(event: Event | null, element: HTMLElement) { return new Mouse_State(event, element, false, false, false, false, false, true); }
	static hover(event: Event | null, element: HTMLElement, isHovering: boolean) { return new Mouse_State(event, element, true, !isHovering, false, false, false, false); }
	static clicks(event: Event | null, element: HTMLElement, clickCount: number) { return new Mouse_State(event, element, false, false, false, false, clickCount > 1, false); }
}
