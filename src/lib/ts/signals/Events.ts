import { s_mouse_location, s_mouse_up_count, s_alteration_mode } from '../state/Reactive_State';
import { g, get, Point, debug, signals, Alteration_State } from '../common/Global_Imports';
import { s_resize_count, s_device_isMobile } from '../state/Reactive_State';

class Events {

	setup() {
		this.subscribeTo_events();
		this.subscribeTo_resizeEvents();
		this.subscribeTo_alterationState();
	}

	subscribeTo_events() {
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

	subscribeTo_alterationState() {
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

	subscribeTo_resizeEvents() {
		window.addEventListener('resize', (event) => {
			setTimeout(() => {
				const isMobile = g.device_isMobile;
				debug.log_action(` resize [is${isMobile ? '' : ' not'} mobile] STATE`);
				s_resize_count.set(get(s_resize_count) + 1);
				s_device_isMobile.set(isMobile);
				g.graphRect_update();
			}, 1);
		});
		window.addEventListener('orientationchange', () => {
			setTimeout(() => {
				const isMobile = g.device_isMobile;
				debug.log_action(` orientationchange [is${isMobile ? '' : ' not'} mobile] STATE`);
				s_device_isMobile.set(isMobile);
				g.graphRect_update();
			}, 1);
		});
	}

}

export let events = new Events();
