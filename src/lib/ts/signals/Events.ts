import { s_mouse_location, s_mouse_up_count, s_alteration_mode } from '../state/Reactive_State';
import { s_resize_count, s_device_isMobile, s_user_graphOffset } from '../state/Reactive_State';
import { g, get, Point, debug, signals, Alteration_State } from '../common/Global_Imports';

class Events {
	initialTouch: Point | null = null;
	interval: NodeJS.Timeout | null = null;

	setup() {
		s_alteration_mode.subscribe((state: Alteration_State | null) => { this.handle_alteration_state(state); });
		s_device_isMobile.subscribe((isMobile: boolean) => { this.subscribeTo_events(); });
		this.subscribeTo_events();
	}

	update_event_listener(name: string, handler: EventListenerOrEventListenerObject) {
		window.removeEventListener(name, handler);
		window.addEventListener(name, handler);
	}

	clear_event_subscriptions() {
		window.removeEventListener('mouseup',	 this.handle_mouse_up);
		window.removeEventListener('mousemove',	 this.handle_mouse_move);
		window.removeEventListener('touchend',	 this.handle_touch_end);
		window.removeEventListener('touchmove',	 this.handle_touch_move);
		window.removeEventListener('touchstart', this.handle_touch_start);
	}

	subscribeTo_events() {
		this.clear_event_subscriptions();
		this.update_event_listener('wheel', this.handle_wheel);
		this.update_event_listener('resize', this.handle_resize);
		this.update_event_listener('orientationchange', this.handle_orientation_change);
		if (g.device_isMobile) {
			debug.log_action(`  mobile subscribe GRAPH`);
			window.addEventListener('touchend', this.handle_touch_end, { passive: false });
			window.addEventListener('touchmove', this.handle_touch_move, { passive: false });
			window.addEventListener('touchstart', this.handle_touch_start, { passive: false });
		} else {
			window.addEventListener('mouseup', this.handle_mouse_up);
			window.addEventListener('mousemove', this.handle_mouse_move);
		}
	}

	handle_mouse_up(event: MouseEvent) {
		event.preventDefault();
		s_mouse_up_count.set(get(s_mouse_up_count) + 1);
		// this.respondTo_closure(event, Mouse_State.up);
	}

	handle_mouse_move(event: MouseEvent) {
		event.preventDefault();
		s_mouse_location.set(new Point(event.clientX, event.clientY));
		// this.respondTo_closure(event, Mouse_State.move);
	}

	handle_wheel(event: Event) {
		event.preventDefault();
		if (!g.device_isMobile) {
			const e = event as WheelEvent;
			const userOffset = get(s_user_graphOffset);
			const delta = new Point(-e.deltaX, -e.deltaY);
			if (!!userOffset && g.allow_HorizontalScrolling && delta.magnitude > 1) {
				debug.log_action(` wheel GRAPH`);
				g.graphOffset_setTo(userOffset.offsetBy(delta));
			}
		}
	}

	handle_alteration_state(state: Alteration_State | null) {
		if (!!this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
		if (!!state) {
			let blink = true;
			this.interval = setInterval(() => {
				signals.signal_altering(blink ? state : null);
				blink = !blink;
			}, 500)
		} else {
			signals.signal_altering(null);
		}
	}

	handle_resize(event: Event) {
		// called when simulator switches platform (e.g., desktop <--> iphone)
		const isMobile = g.device_isMobile;
		debug.log_action(` resize [is${isMobile ? '' : ' not'} mobile] STATE`);
		s_resize_count.set(get(s_resize_count) + 1);
		s_device_isMobile.set(isMobile);
		g.graphRect_update();
	}

	handle_orientation_change(event: Event) {
		const isMobile = g.device_isMobile;
		debug.log_action(` orientation change [is${isMobile ? '' : ' not'} mobile] STATE`);
		s_device_isMobile.set(isMobile);
		g.graphRect_update();
	}

	handle_touch_start(event: TouchEvent) {
		if (event.touches.length == 2) {
			const touch = event.touches[0];
			this.initialTouch = new Point(touch.clientX, touch.clientY);
			debug.log_action(` two-finger touches GRAPH`);
		}
	}

	handle_touch_move(event: TouchEvent) {
		if (event.touches.length == 2) {
			event.preventDefault();
			if (this.initialTouch) {
				const touch = event.touches[0];
				const deltaX = touch.clientX - this.initialTouch.x;
				const deltaY = touch.clientY - this.initialTouch.y;
				s_user_graphOffset.set(new Point(deltaX, deltaY));
				debug.log_action(` two-finger touch move GRAPH`);
			}
		}
	}

	handle_touch_end(event: TouchEvent) {
		this.initialTouch = null;
	}

}

export let events = new Events();
