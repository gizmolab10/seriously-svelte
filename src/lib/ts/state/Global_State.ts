import { persistLocal, IDPersistant, SvelteWrapper, Alteration_State, SvelteComponentType } from '../common/GlobalImports';
import { k, u, get, Rect, Size, Point, debug, signals, debugReact, dbDispatch } from '../common/GlobalImports';
import { s_graphRect, s_altering, s_show_details, s_scale_factor, s_thing_changed } from './ReactiveState';
import { s_resize_count, s_rebuild_count, s_mouse_up_count, s_mouse_location } from './ReactiveState';

class Global_State {
	mouseUp_subscribers: {[type: string]: Array<SvelteWrapper>} = {};

	setup() {
		s_resize_count.set(0);
		s_rebuild_count.set(0);
		persistLocal.restore();
		k.queryStrings_apply();
		s_mouse_up_count.set(0);
		s_thing_changed.set(k.empty);
		persistLocal.queryStrings_apply();
		debug.queryStrings_apply();
		debugReact.queryStrings_apply();
		this.subscribeTo_events();
		this.subscribeTo_alterationState();
	}

	get windowSize(): Size {
		const ratio = get(s_scale_factor);
		return new Size(window.innerWidth / ratio, window.innerHeight / ratio);
	}

	get isServerLocal(): boolean {
		const hostname = window.location.hostname;
		return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
	}

	get siteTitle(): string {
		const dbType = dbDispatch.db.dbType;
		const baseID = dbDispatch.db.baseID;
		const host = this.isServerLocal ? 'local' : 'remote';
		const db_name = dbType ? (dbType! + ', ') : k.empty;
		const base_name = baseID ? (baseID! + ', ') : k.empty;
		return `Seriously (${host}, ${db_name}${base_name}${u.browserType}, α)`;
	}

	get device_isMobile(): boolean {
		const userAgent = navigator.userAgent;
		if (/android/i.test(userAgent) || /iPhone|iPad|iPod/i.test(userAgent)) {    // Check for phones
			return true;
		}
		if (/iPad|Android|Touch/i.test(userAgent) && !(window as any).MSStream) {    // Check for tablets
			return true;
		}
		return false;
	}

	open_tabFor(url: string) { window.open(url, 'help-webseriously')?.focus(); }

	showHelp() {
		const url = this.isServerLocal ? k.local_help_url : k.remote_help_url;
		this.open_tabFor(url);
	}

	subscribeTo_mouseUp(wrapper: SvelteWrapper) {
		const type = wrapper.type;
		const wrappers = this.mouseUp_subscribers[type] ?? [];
		wrappers.push(wrapper);
		this.mouseUp_subscribers[type] = wrappers;
	}

	unsubscribeTo_mouseUp(wrapper: SvelteWrapper) {
		const type = wrapper.type;
		const wrappers = this.mouseUp_subscribers[type];
		if (!!wrappers) {
			u.remove(wrappers, wrapper);
		}
		this.mouseUp_subscribers[type] = wrappers;
	}

	respondTo_mouseUp() {
		const types = [SvelteComponentType.title, SvelteComponentType.drag, SvelteComponentType.reveal, SvelteComponentType.widget, SvelteComponentType.ring];
		for (const type of types) {
			const wrappers = this.mouseUp_subscribers[type] ?? [];
			for (const wrapper of wrappers) {
				if (wrapper.isHit()) {
					wrapper.handle_mouseUp();
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
			this.graphRect_update();
		});
		window.addEventListener('mouseup', (event: MouseEvent) => {
			event.stopPropagation();
			this.respondTo_mouseUp();
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

	zoomBy(factor: number): number {
		const zoomContainer = document.documentElement;
		const currentScale = parseFloat(getComputedStyle(zoomContainer).getPropertyValue('zoom')) || 1;
		const scale = currentScale * factor;
		persistLocal.key_write(IDPersistant.scale, scale);
		this.applyScale(scale);
		return this.windowSize.width;
	}

	applyScale(scale: number) {
		s_scale_factor.set(scale)
		const zoomContainer = document.documentElement;
		zoomContainer.style.setProperty('zoom', scale.toString());
		zoomContainer.style.transform = `scale(var(zoom))`;
		zoomContainer.style.height = `${100 / scale}%`;
		zoomContainer.style.width = `${100 / scale}%`;
		this.graphRect_update();
	}

	graphRect_update() {
		const top = k.show_titleAtTop ? 114 : 69;						// height of content above the graph
		const left = get(s_show_details) ? k.width_details : 0;			// width of details
		const originOfGraph = new Point(left, top);
		const sizeOfGraph = this.windowSize.reducedBy(originOfGraph);		// account for origin
		const rect = new Rect(originOfGraph, sizeOfGraph);
		s_graphRect.set(rect);											// used by Panel and Graph_Tree
	}

}

export let g = new Global_State();
