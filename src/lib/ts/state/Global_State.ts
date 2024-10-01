import { s_show_rings, s_ring_paging_state, s_ring_resizing_state, s_ring_rotation_state } from './Reactive_State';
import { s_graphRect, s_show_details, s_scale_factor, s_color_thing, s_user_graphOffset } from './Reactive_State';
import { s_rebuild_count, s_focus_ancestry, s_grabbed_ancestries, s_expanded_ancestries } from './Reactive_State';
import { k, u, ux, get, show, Rect, Size, Point, debug, events, dbDispatch } from '../common/Global_Imports';
import { persistLocal, IDPersistent, Rotation_State, Expansion_State } from '../common/Global_Imports';
import { s_resize_count, s_mouse_up_count } from '../state/Reactive_State';
import { h } from '../db/DBDispatch';

class Global_State {
	allow_GraphEditing = true;
	allow_TitleEditing = true;
	allow_HorizontalScrolling = true;

	things_arrived = false;
	isEditing_text = false;
	mouse_responder_number = 0;
	queryStrings: URLSearchParams;
	rebuild_needed_byType: {[type: string]: boolean} = {};

	constructor() {
		this.queryStrings = new URLSearchParams(window.location.search);
	}
	
	setup() {
		
		//////////////////////////////////////////////
		// this is the first code called by the app //
		//////////////////////////////////////////////

		s_resize_count.set(0);							// defaults
		s_rebuild_count.set(0);
		s_mouse_up_count.set(0);
		s_color_thing.set(null);
		s_ring_paging_state.set(new Rotation_State());
		s_ring_rotation_state.set(new Rotation_State());
		s_ring_resizing_state.set(new Expansion_State());
		persistLocal.restore_state();					// persisted
		persistLocal.restore_db();
		this.queryStrings_apply();						// url query string
		show.queryStrings_apply();
		debug.queryStrings_apply();
		events.setup();
	}

	queryStrings_apply() {
		const queryStrings = this.queryStrings;
        const deny = queryStrings.get('deny');
        const eraseOptions = queryStrings.get('erase')?.split(k.comma) ?? [];
		persistLocal.applyFor_key_name(IDPersistent.layout, 'clusters', (flag) => s_show_rings.set(flag));
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
		for (const option of eraseOptions) {
			switch (option) {
				case 'data':
					dbDispatch.eraseDB = true;
					break;
				case 'settings': 
					localStorage.clear();
					s_expanded_ancestries.set([]);
					s_focus_ancestry.set(h.rootAncestry);
					s_grabbed_ancestries.set([h.rootAncestry]);
					break;
			}
		}
    }

	get graph_center(): Point {
		return get(s_graphRect).size.dividedInHalf.asPoint;
	}

	get isAny_rotation_active(): boolean {
		return ux.isAny_paging_arc_active || get(s_ring_paging_state).isActive || get(s_ring_rotation_state).isActive;
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

	require_rebuild_forType(type: string) {
		this.rebuild_needed_byType[type] = true;
	}

	readOnce_rebuild_needed_forType(type: string) : boolean {
		const needed = this.rebuild_needed_byType[type];
		this.rebuild_needed_byType[type] = false;
		return needed;
	}

	showHelp() {
		const url = this.isServerLocal ? k.local_help_url : k.remote_help_url;
		this.open_tabFor(url);
	}

	graphOffset_setTo(origin: Point): boolean {
		if (get(s_user_graphOffset) != origin) {
			persistLocal.write_key(IDPersistent.origin, origin);
			s_user_graphOffset.set(origin);
			return true;
		}
		return false;
	}

	graphRect_update() {
		const top = show.titleAtTop ? 114 : 69;						// height of content above the graph
		const left = get(s_show_details) ? k.width_details : 0;			// width of details
		const originOfGraph = new Point(left, top);
		const sizeOfGraph = this.windowSize.reducedBy(originOfGraph);	// account for origin
		const rect = new Rect(originOfGraph, sizeOfGraph);
		s_graphRect.set(rect);											// used by Panel and Graph_Tree
	}

	zoomBy(factor: number): number {
		const zoomContainer = document.documentElement;
		const currentScale = parseFloat(getComputedStyle(zoomContainer).getPropertyValue('zoom')) || 1;
		const scale = currentScale * factor;
		persistLocal.write_key(IDPersistent.scale, scale);
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

}

export let g = new Global_State();
