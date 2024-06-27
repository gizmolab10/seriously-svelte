import { Rect } from '../common/GlobalImports';

export default class Mouse_State {
	element: HTMLElement | null;	// null means mouse responder
	event: MouseEvent | null;			// null means mouse movement from global state
	isDouble: boolean;
	isHover: boolean;
	isMove: boolean;
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

	constructor(event: MouseEvent | null, element: HTMLElement | null, isHover: boolean, isOut: boolean, isDown: boolean, isUp: boolean, isDouble: boolean, isLong: boolean, isMove: boolean) {
		this.event = event;
		this.element = element;
		this.isDouble = isDouble;
		this.isHover = isHover;
		this.isMove = isMove;
		this.isLong = isLong;
		this.isDown = isDown;
		this.isOut = isOut;
		this.isUp = isUp;
	}

	get isHit(): boolean {
		return !!this.event && !!this.element &&
			Rect.rect_forElement_containsEvent(this.element, this.event);
	}

	static empty() { return new Mouse_State(null, null, false, false, false, true, false, false, false); }
	static up(event: MouseEvent | null, element: HTMLElement) { return new Mouse_State(event, element, false, false, false, true, false, false, false); }
	static move(event: MouseEvent | null, element: HTMLElement) { return new Mouse_State(event, element, false, false, true, false, false, false, true); }
	static down(event: MouseEvent | null, element: HTMLElement) { return new Mouse_State(event, element, false, false, true, false, false, false, false); }
	static long(event: MouseEvent | null, element: HTMLElement) { return new Mouse_State(event, element, false, false, false, false, false, true, false); }
	static hover(event: MouseEvent | null, element: HTMLElement, isHovering: boolean) { return new Mouse_State(event, element, true, !isHovering, false, false, false, false, false); }
	static clicks(event: MouseEvent | null, element: HTMLElement, clickCount: number) { return new Mouse_State(event, element, false, false, false, false, clickCount > 1, false, false); }

}