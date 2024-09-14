import { s_cluster_mode, s_paging_ring_state, s_ring_resizing_state, s_ring_rotation_state } from './Reactive_State';
import { s_rebuild_count, s_ancestry_focus, s_ancestries_grabbed, s_ancestries_expanded } from './Reactive_State';
import { persistLocal, IDPersistant, Rotation_State, Expansion_State } from '../common/Global_Imports';
import { e, k, u, ux, get, Rect, Size, Point, debug, dbDispatch } from '../common/Global_Imports';
import { s_graphRect, s_show_details, s_scale_factor, s_thing_changed } from './Reactive_State';
import { s_resize_count, s_mouse_up_count } from '../state/Reactive_State';
import { h } from '../db/DBDispatch';

class Global_State {
	show_tinyDots = true;
	show_controls = false;
	show_titleAtTop = false;
	show_arrowheads = false;
	allow_GraphEditing = true;
	allow_TitleEditing = true;
	mouse_responder_number = 0;
	queryStrings: URLSearchParams;
	allow_HorizontalScrolling = true;

	constructor() {
		this.queryStrings = new URLSearchParams(window.location.search);
	}

	setup() {											// from
		s_resize_count.set(0);							// defaults
		s_rebuild_count.set(0);
		s_mouse_up_count.set(0);
		s_thing_changed.set(null);
		s_paging_ring_state.set(new Rotation_State());
		s_ring_rotation_state.set(new Rotation_State());
		s_ring_resizing_state.set(new Expansion_State());
		persistLocal.restore_state();					// persisted
		this.queryStrings_apply();						// url query string
		debug.queryStrings_apply();
		e.setup();
	}

	queryStrings_apply() {
		const queryStrings = this.queryStrings;
        const deny = queryStrings.get('deny');
		const shownNames = queryStrings.get('show')?.split(k.comma) ?? [];
		const hiddenNames = queryStrings.get('hide')?.split(k.comma) ?? [];
        const eraseOptions = queryStrings.get('erase')?.split(k.comma) ?? [];
		const shown = Object.fromEntries(shownNames.map(s => [s, true]) ?? {});
		const hidden = Object.fromEntries(hiddenNames.map(s => [s, false]) ?? {});
		const keyedFlags: { [key: string]: boolean } = {...shown, ...hidden};
		persistLocal.applyFor_key_name(IDPersistant.layout, 'clusters', (flag) => s_cluster_mode.set(flag));
        if (deny) {
            const flags = deny.split(',');
            for (const option of flags) {
                switch (option) {
                    case 'editGraph': this.allow_GraphEditing = false; break;
                    case 'editTitles': this.allow_TitleEditing = false; break;
                    case 'horizontalScrolling': this.allow_HorizontalScrolling = false; break;
                }
            }
        }
		for (const [name, flag] of Object.entries(keyedFlags)) {
			switch (name) {
				case 'details':
					s_show_details.set(flag);
					break;
				case 'controls':
					this.show_controls = flag;
					persistLocal.write_key(IDPersistant.controls, flag);
					break;
				case 'tinyDots':
					this.show_tinyDots = flag;
					persistLocal.write_key(IDPersistant.tinyDots, flag);
					break;
				case 'arrowheads':
					this.show_arrowheads = flag;
					persistLocal.write_key(IDPersistant.arrowheads, flag);
					break;
				case 'titleAtTop':
					this.show_titleAtTop = flag;
					persistLocal.write_key(IDPersistant.title_atTop, flag);
					break;
			}
		}
		for (const option of eraseOptions) {
			switch (option) {
				case 'data':
					dbDispatch.eraseDB = true;
					break;
				case 'settings': 
					localStorage.clear();
					s_ancestries_expanded.set([]);
					s_ancestry_focus.set(h.rootAncestry);
					s_ancestries_grabbed.set([h.rootAncestry]);
					break;
			}
		}
    }

	get graph_center(): Point {
		return get(s_graphRect).size.dividedInHalf.asPoint;
	}

	get isAny_rotation_active(): boolean {
		return ux.isAny_paging_arc_active || get(s_paging_ring_state).isActive || get(s_ring_rotation_state).isActive;
	}

	get next_mouse_responder_number(): number {
		this.mouse_responder_number += 1;
		return this.mouse_responder_number;
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

	zoomBy(factor: number): number {
		const zoomContainer = document.documentElement;
		const currentScale = parseFloat(getComputedStyle(zoomContainer).getPropertyValue('zoom')) || 1;
		const scale = currentScale * factor;
		persistLocal.write_key(IDPersistant.scale, scale);
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
		const top = this.show_titleAtTop ? 114 : 69;						// height of content above the graph
		const left = get(s_show_details) ? k.width_details : 0;			// width of details
		const originOfGraph = new Point(left, top);
		const sizeOfGraph = this.windowSize.reducedBy(originOfGraph);	// account for origin
		const rect = new Rect(originOfGraph, sizeOfGraph);
		s_graphRect.set(rect);											// used by Panel and Graph_Tree
	}

}

export let g = new Global_State();
