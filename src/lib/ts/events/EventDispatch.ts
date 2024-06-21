import { s_altering, s_resize_count, s_rebuild_count, s_mouse_up_count, s_mouse_location } from '../state/ReactiveState';
import { g, u, get, Point, signals, Mouse_State, Create_Mouse_State } from '../common/GlobalImports';
import { SvelteWrapper, Alteration_State, SvelteComponentType } from '../common/GlobalImports';

export class EventDispatch {
	subscribersTo_mouseData: {[type: string]: Array<SvelteWrapper>} = {};

	// assure delivery of events
	// to a svelt component
	// with a higher ZIndex
	// than the containing component
	// when they overlap

	setup() {
		s_resize_count.set(0);
		s_rebuild_count.set(0);
		s_mouse_up_count.set(0);
		this.subscribeTo_events();
		this.subscribeTo_alterationState();
	}

	subscribeTo_mouseData(wrapper: SvelteWrapper) {
		const type = wrapper.type;
		const wrappers = this.subscribersTo_mouseData[type] ?? [];
		wrappers.push(wrapper);
		this.subscribersTo_mouseData[type] = wrappers;
	}

	unsubscribeTo_mouseData(wrapper: SvelteWrapper) {
		const type = wrapper.type;
		const wrappers = this.subscribersTo_mouseData[type];
		if (!!wrappers) {
			u.remove(wrappers, wrapper);
		}
		this.subscribersTo_mouseData[type] = wrappers;
	}

	respondTo_closure(closure: Create_Mouse_State) {
		const types = [SvelteComponentType.ring];
		// const types = [SvelteComponentType.title, SvelteComponentType.drag, SvelteComponentType.reveal, SvelteComponentType.widget, SvelteComponentType.ring];
		for (const type of types) {
			const wrappers = this.subscribersTo_mouseData[type] ?? [];
			for (const wrapper of wrappers) {
				if (wrapper.handle_closure(closure)) {
					return;
				}
			}
		}
		// in order of priority by wrapper type
		// ask each wrapper if isHit is true
		// if yes, stop and call its mouse up handler
		// else keep going

	}

	subscribeTo_events() {
		window.addEventListener('resize', (event) => {
			s_resize_count.set(get(s_resize_count) + 1)
			g.graphRect_update();
		});
		window.addEventListener('mouseup', (event: MouseEvent) => {
			event.stopPropagation();
			e.respondTo_closure(Mouse_State.up);
			// s_mouse_up_count.set(get(s_mouse_up_count) + 1);
		});
		window.addEventListener('mousemove', (event: MouseEvent) => {
			event.stopPropagation();
			s_mouse_location.set(new Point(event.clientX, event.clientY));
		});
	}

	subscribeTo_alterationState() {
		let interval: NodeJS.Timeout | null = null;

		s_altering.subscribe((state: Alteration_State | null) => {
			if (interval) {
				clearInterval(interval);
				interval = null;
			}
			if (state) {
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

export const e = new EventDispatch();
