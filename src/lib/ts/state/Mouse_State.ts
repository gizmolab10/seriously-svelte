import { k, Rect } from '../common/Global_Imports';

export default class Mouse_State {
	element: HTMLElement | null;	// null means mouse responder
	event: MouseEvent | null;		// null means mouse movement from global state
	isDouble: boolean;
	isHover: boolean;
	isMove: boolean;
	isLong: boolean;
	isDown: boolean;
	isOut: boolean;
	isHit: boolean;
	isUp: boolean;
	clicks = 0;

	//////////////////////////////////////////////
	//	encapsulate relevant event properties	//
	//	pass to buttons, widgets, rings & arcs	//
	//	isOut is mirrored in Element_State		//
	//////////////////////////////////////////////

	constructor(event: MouseEvent | null, element: HTMLElement | null, isHover: boolean, isOut: boolean, isDown: boolean, isUp: boolean, isDouble: boolean, isLong: boolean, isMove: boolean, isHit: boolean = false) {
		this.isDouble = isDouble;
		this.element = element;
		this.isHover = isHover;
		this.isMove = isMove;
		this.isLong = isLong;
		this.isDown = isDown;
		this.event = event;
		this.isOut = isOut;
		this.isHit = isHit;
		this.isUp = isUp;
	}

	get isShapeHit(): boolean { return false; }
	get isEmpty(): boolean { return !this.isHover && !this.isOut && !this.isDown && !this.isUp && !this.isDouble && !this.isLong && !this.isMove && !this.isHit; }
	get copy(): Mouse_State { return new Mouse_State(this.event, this.element, this.isHover, this.isOut, this.isDown, this.isUp, this.isDouble, this.isLong, this.isMove, this.isHit); }

	get isElementHit(): boolean {
		return !!this.event && !!this.element &&
			Rect.rect_forElement_containsEvent(this.element, this.event);
	}

	get description(): string {
		let states: Array<string> = [];
		if (this.isHover) { states.push('hover'); }
		if (this.isOut) { states.push('out'); }
		if (this.isDown) { states.push('down'); }
		if (this.isUp) { states.push('up'); }
		if (this.isDouble) { states.push('double'); }
		if (this.isLong) { states.push('long'); }
		if (this.isMove) { states.push('move'); }
		if (this.isHit) { states.push('hit'); }
		return states.length == 0 ? 'empty mouse state' : states.join(', ');
	}

	descriptionFor(name: string = ''): string { return `${name} states: ${this.description}`; }
	static empty(event: MouseEvent | null = null) { return new Mouse_State(event, null, false, false, false, true, false, false, false); }
	static hit(event: MouseEvent | null = null) { return new Mouse_State(event, null, false, false, false, true, false, false, false, true); }
	static up(event: MouseEvent | null, element: HTMLElement) { return new Mouse_State(event, element, false, false, false, true, false, false, false); }
	static down(event: MouseEvent | null, element: HTMLElement) { return new Mouse_State(event, element, false, false, true, false, false, false, false); }
	static long(event: MouseEvent | null, element: HTMLElement) { return new Mouse_State(event, element, false, false, false, false, false, true, false); }
	static hover(event: MouseEvent | null, element: HTMLElement, isHovering: boolean) { return new Mouse_State(event, element, true, !isHovering, false, false, false, false, false); }
	static clicks(event: MouseEvent | null, element: HTMLElement, clickCount: number) { return new Mouse_State(event, element, false, false, false, false, clickCount > 1, false, false); }
	static move(event: MouseEvent | null, element: HTMLElement, isDown: boolean, isHit: boolean) { return new Mouse_State(event, element, false, false, isDown, false, false, false, isHit); }

}
