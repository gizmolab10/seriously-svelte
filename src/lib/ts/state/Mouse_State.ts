import type { SvelteComponent } from '../common/GlobalImports';

export default class Mouse_State {
	component: SvelteComponent | null;	// null means mouse responder
	event: Event | null;				// null means mouse movement from global state
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

	constructor(event: Event | null, component: SvelteComponent | null, isHover: boolean, isOut: boolean, isDown: boolean, isUp: boolean, isDouble: boolean, isLong: boolean) {
		this.component = component;
		this.isDouble = isDouble;
		this.isHover = isHover;
		this.isLong = isLong;
		this.isDown = isDown;
		this.isOut = isOut;
		this.event = event;
		this.isUp = isUp;
	}

	static empty() { return new Mouse_State(null, null, false, false, false, true, false, false); }
	static up(event: Event | null, component: SvelteComponent) { return new Mouse_State(event, component, false, false, false, true, false, false); }
	static down(event: Event | null, component: SvelteComponent) { return new Mouse_State(event, component, false, false, true, false, false, false); }
	static long(event: Event | null, component: SvelteComponent) { return new Mouse_State(event, component, false, false, false, false, false, true); }
	static hover(event: Event | null, component: SvelteComponent, isHovering: boolean) { return new Mouse_State(event, component, true, !isHovering, false, false, false, false); }
	static clicks(event: Event | null, component: SvelteComponent, clickCount: number) { return new Mouse_State(event, component, false, false, false, false, clickCount > 1, false); }

}
