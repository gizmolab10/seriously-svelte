import { s_mouse_location, s_mouse_up_count, s_alteration_mode } from '../state/Reactive_State';
import { get, Point, signals, Alteration_State } from '../common/Global_Imports';

class Events {

	setup() {
		this.subscribeTo_events();
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

}

export let events = new Events();
