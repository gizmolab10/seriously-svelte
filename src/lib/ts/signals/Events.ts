import { s_mouse_location, s_mouse_up_count, s_alteration_mode } from '../state/Reactive_State';
import { s_resize_count, s_device_isMobile, s_user_graphOffset } from '../state/Reactive_State';
import { g, get, Point, debug, signals, Alteration_State } from '../common/Global_Imports';

class Events {
	initialTouch: Point | null = null;

	setup() {
		this.subscribeTo_alteration_state();
		this.setup_platform();
	}

	setup_platform() {
		this.subscribeTo_platform_events();
		if (g.device_isMobile) {
			this.subscribeTo_touch_events();
		} else {
			this.subscribeTo_mouse_events();
		}
	}

	subscribeTo_alteration_state() {
		let interval: NodeJS.Timeout | null = null;
		s_alteration_mode.subscribe((state: Alteration_State | null) => {
			if (!!interval) {
				clearInterval(interval);
				interval = null;
			}
			if (!!state) {
				let blink = true;
				interval = setInterval(() => {
					signals.signal_altering(blink ? state : null);
					blink = !blink;
				}, 500)
			} else {
				signals.signal_altering(null);
			}
		})
	}

	subscribeTo_platform_events() {
		window.removeEventListener('resize', this.platform_resize);
		window.addEventListener('resize', (event) => { this.platform_resize(event); });
		window.removeEventListener('orientationchange', this.platform_orientation_change);
		window.addEventListener('orientationchange', (event) => { this.platform_orientation_change(event); });
	}

	platform_resize(event: Event) {
		setTimeout(() => {
			const isMobile = g.device_isMobile;
			debug.log_action(` resize [is${isMobile ? '' : ' not'} mobile] STATE`);
			s_resize_count.set(get(s_resize_count) + 1);
			s_device_isMobile.set(isMobile);
			g.graphRect_update();
			this.setup_platform();
		}, 1);
	}

	platform_orientation_change(event: Event) {
		setTimeout(() => {
			const isMobile = g.device_isMobile;
			debug.log_action(` orientationchange [is${isMobile ? '' : ' not'} mobile] STATE`);
			s_device_isMobile.set(isMobile);
			g.graphRect_update();
			this.setup_platform();
		}, 1);
	}

	subscribeTo_mouse_events() {
		window.addEventListener('mouseup', (event: MouseEvent) => {
			event.stopPropagation();
			s_mouse_up_count.set(get(s_mouse_up_count) + 1);
			// this.respondTo_closure(event, Mouse_State.up);
		});
		window.addEventListener('mousemove', (event: MouseEvent) => {
			event.stopPropagation();
			s_mouse_location.set(new Point(event.clientX, event.clientY));
			// this.respondTo_closure(event, Mouse_State.move);
		});
		// window.addEventListener('mousedown', (event: MouseEvent) => {
		// 	event.stopPropagation();
		// 	this.respondTo_closure(event, Mouse_State.down);
		// });
	}

	subscribeTo_touch_events() {
		window.removeEventListener('touchend', this.mobile_touch_end);
		window.removeEventListener('touchmove', this.mobile_touch_move);
		window.removeEventListener('touchstart', this.mobile_touch_start);
		if (g.device_isMobile) {
			debug.log_action(`  mobile subscribe GRAPH`);
			window.addEventListener('touchend', this.mobile_touch_end, { passive: false });
			window.addEventListener('touchmove', this.mobile_touch_move, { passive: false });
			window.addEventListener('touchstart', this.mobile_touch_start, { passive: false });
		}
	}

	mobile_touch_end(event: TouchEvent) {
		this.initialTouch = null;
	}

	mobile_touch_start(event: TouchEvent) {
		if (event.touches.length == 2) {
			const touch = event.touches[0];
			this.initialTouch = new Point(touch.clientX, touch.clientY);
			debug.log_action(` two-finger touches GRAPH`);
		}
	}

	mobile_touch_move(event: TouchEvent) {
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

}

export let events = new Events();
