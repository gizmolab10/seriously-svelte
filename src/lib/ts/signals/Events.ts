import { w_count_resize, w_count_mouse_up, w_device_isMobile, w_s_alteration } from '../common/Stores';
import { w_user_graph_offset, w_mouse_location, w_mouse_location_scaled } from '../common/Stores';
import { c, k, ux, w, Point, debug, signals, S_Alteration } from '../common/Global_Imports';
import { get } from 'svelte/store';

export class Events {
	initialTouch: Point | null = null;
	interval: NodeJS.Timeout | null = null;

	setup() {
		w_s_alteration.subscribe((state: S_Alteration | null) => { this.handle_alteration_state(state); });
		w_device_isMobile.subscribe((isMobile: boolean) => { this.subscribeTo_events(); });
		this.subscribeTo_events();
	}

	update_event_listener(name: string, handler: EventListenerOrEventListenerObject) {
		window.removeEventListener(name, handler);
		window.addEventListener(name, handler, { passive: false });
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
		this.update_event_listener('keydown', this.handle_zoom);
		this.update_event_listener('resize', this.handle_resize);
		this.update_event_listener('orientationchange', this.handle_orientation_change);
		if (c.device_isMobile) {
			debug.log_action(`  mobile subscribe GRAPH`);
			window.addEventListener('touchend', this.handle_touch_end, { passive: false });
			window.addEventListener('touchmove', this.handle_touch_move, { passive: false });
			window.addEventListener('touchstart', this.handle_touch_start, { passive: false });
		} else {
			window.addEventListener('mouseup', this.handle_mouse_up, { passive: false });
			window.addEventListener('mousemove', this.handle_mouse_move, { passive: false });
		}
	}

	handle_zoom(e: Event) {
		const event = e as KeyboardEvent;
		const key = event.key;
		if (event.metaKey && ['+', '=', '-', '0'].includes(key)) {
			event.preventDefault();
			event.stopPropagation();
			switch (key) {
				case '0': w.applyScale(1); break;
				case '-': w.zoomBy(k.zoom_out_ratio); break;
				default: w.zoomBy(k.zoom_in_ratio); break;
			}
			w.renormalize_user_graph_offset();
			ux.grand_build();
		}
	}

	handle_mouse_up(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		w_count_mouse_up.update(n => n + 1);
		// this.respondTo_closure(event, S_Mouse.up);
	}

	handle_mouse_move(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		const location = new Point(event.clientX, event.clientY);
		w_mouse_location.set(location);
		w_mouse_location_scaled.set(location.dividedBy(w.scale_factor));
		// this.respondTo_closure(event, S_Mouse.move);
	}

	handle_wheel(event: Event) {
		event.preventDefault();
		event.stopPropagation();
		if (!c.device_isMobile) {
			const e = event as WheelEvent;
			const userOffset = get(w_user_graph_offset);
			const delta = new Point(-e.deltaX, -e.deltaY);
			if (!!userOffset && c.allow_HorizontalScrolling && delta.magnitude > 1) {
				debug.log_action(` wheel GRAPH`);
				w.user_graph_offset_setTo(userOffset.offsetBy(delta));
			}
		}
	}

	handle_alteration_state(state: S_Alteration | null) {
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
		// called when simulator switches platform (e.c., desktop <--> iphone)
		const isMobile = c.device_isMobile;
		debug.log_action(` resize [is${isMobile ? '' : ' not'} mobile] STATE`);
		w_count_resize.update(n => n + 1);
		w_device_isMobile.set(isMobile);
		w.restore_state();
	}

	handle_orientation_change(event: Event) {
		const isMobile = c.device_isMobile;
		debug.log_action(` orientation change [is${isMobile ? '' : ' not'} mobile] STATE`);
		w_device_isMobile.set(isMobile);
		w.restore_state();
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
			event.stopPropagation();
			if (this.initialTouch) {
				const touch = event.touches[0];
				const deltaX = touch.clientX - this.initialTouch.x;
				const deltaY = touch.clientY - this.initialTouch.y;
				w.user_graph_offset_setTo(new Point(deltaX, deltaY));
				debug.log_action(` two-finger touch move GRAPH`);
			}
		}
	}

	handle_touch_end(event: TouchEvent) {
		this.initialTouch = null;
	}
	// // Attach drag-and-drop event listeners to the window
	// window.addEventListener('dragover', (event) => {
	//     event.preventDefault(); // Prevent default behavior to allow drop
	//     console.log('File being dragged over the window.');
	// });

	// window.addEventListener('drop', (event) => {
	//     event.preventDefault(); // Prevent default behavior (e.g., opening the file in the browser)

	//     // Access the dropped files
	//     const files = event.dataTransfer?.files;
	//     if (files && files.length > 0) {
	//         console.log(`File(s) dropped: ${files.length}`);
			
	//         // Process the first file
	//         const file = files[0];
	//         console.log(`File name: ${file.name}`);
	//         console.log(`File size: ${file.size} bytes`);
	//         console.log(`File type: ${file.type}`);

	//         // Example: Reading the file content
	//         const reader = new FileReader();
	//         reader.onload = (e) => {
	//             console.log('File content:', e.target?.result);
	//         };
	//         reader.onerror = () => {
	//             console.error('Error reading the file.');
	//         };
	//         reader.readAsText(file); // Reads file as text (adjust based on your needs)
	//     } else {
	//         console.log('No files dropped.');
	//     }
	// });

}

export let e = new Events();
