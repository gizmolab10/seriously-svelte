import { Rect } from '../common/Global_Imports';

export default class S_Mouse {
	element: HTMLElement | null;	// null means mouse responder
	event: MouseEvent | null;		// null means mouse movement from global state
	isRepeat: boolean;
	isDouble: boolean;
	hover_didChange: boolean;
	isMove: boolean;
	isLong: boolean;
	isDown: boolean;
	isOut: boolean;
	isHit: boolean;
	isUp: boolean;
	clicks = 0;

	//////////////////////////////////////////////
	//	encapsulate relevant event properties	//
	//	pass to buttons, widgets, radial & arcs	//
	//	isOut is mirrored in S_Element		//
	//////////////////////////////////////////////

	constructor(event: MouseEvent | null, element: HTMLElement | null, hover_didChange: boolean, isOut: boolean, isDown: boolean, isUp: boolean, isDouble: boolean, isLong: boolean, isMove: boolean, isHit: boolean = false, isRepeat: boolean = false) {
		this.isDouble = isDouble;
		this.isRepeat = isRepeat;
		this.element = element;
		this.hover_didChange = hover_didChange;
		this.isDown = isDown;
		this.isLong = isLong;
		this.isMove = isMove;
		this.event = event;
		this.isHit = isHit;
		this.isOut = isOut;
		this.isUp = isUp;
	}

	get isShapeHit():	boolean { return false; }
	get isElementHit(): boolean { return !!this.event && !!this.element && Rect.rect_forElement_containsEvent(this.element, this.event); }
	get notRelevant():	boolean { return !this.hover_didChange && !this.isOut && !this.isDown && !this.isUp && !this.isDouble && !this.isLong && !this.isMove && !this.isHit && !this.isRepeat; }

	get description(): string {
		let states: string[] = [];
		if (this.isUp) { states.push('up'); }
		if (this.isHit) { states.push('hit'); }
		if (this.isOut) { states.push('out'); }
		if (this.isDown) { states.push('down'); }
		if (this.isLong) { states.push('long'); }
		if (this.isMove) { states.push('move'); }
		if (this.hover_didChange) { states.push('hover'); }
		if (this.isDouble) { states.push('double'); }
		if (this.isRepeat) { states.push('repeat'); }
		return states.length == 0 ? 'empty mouse state' : states.join(', ');
	}

	descriptionFor(name: string = ''): string { return `${name} states: ${this.description}`; }
	static empty(event: MouseEvent | null = null) { return new S_Mouse(event, null, false, false, false, true, false, false, false); }
	static hit(event: MouseEvent | null = null) { return new S_Mouse(event, null, false, false, false, true, false, false, false, true); }
	static up(event: MouseEvent | null, element: HTMLElement) { return new S_Mouse(event, element, false, false, false, true, false, false, false); }
	static down(event: MouseEvent | null, element: HTMLElement) { return new S_Mouse(event, element, false, false, true, false, false, false, false); }
	static long(event: MouseEvent | null, element: HTMLElement) { return new S_Mouse(event, element, false, false, false, false, false, true, false); }
	static repeat(event: MouseEvent | null, element: HTMLElement) { return new S_Mouse(event, element, false, false, false, false, false, false, false, false, true); }
	static hover(event: MouseEvent | null, element: HTMLElement, isHit: boolean) { return new S_Mouse(event, element, true, !isHit, false, false, false, false, false); }
	static clicks(event: MouseEvent | null, element: HTMLElement, clickCount: number) { return new S_Mouse(event, element, false, false, false, false, clickCount > 1, false, false); }
	static move(event: MouseEvent | null, element: HTMLElement, isDown: boolean, isHit: boolean) { return new S_Mouse(event, element, false, false, isDown, false, false, false, isHit); }

}
