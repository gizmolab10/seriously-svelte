import { Graph_Type, persistLocal, IDPersistent, Rotation_State, Expansion_State } from '../common/Global_Imports';
import { s_graphRect, s_graph_type, s_show_details, s_color_thing, s_user_graphOffset } from './Reactive_State';
import { s_resize_count, s_device_isMobile, s_mouse_up_count, s_rebuild_count } from '../state/Reactive_State';
import { k, u, ux, get, show, Rect, Size, Point, debug, events, dbDispatch } from '../common/Global_Imports';
import { s_focus_ancestry, s_grabbed_ancestries, s_expanded_ancestries } from './Reactive_State';
import { h } from '../db/DBDispatch';

class Global_State {
	allow_GraphEditing = true;
	allow_TitleEditing = true;
	allow_HorizontalScrolling = true;

	scale_factor = 1;
	fetch_succeeded = false;
	isEditing_text = false;
	scroll = this.windowScroll;
	mouse_responder_number = 0;
	ring_rotation_state!: Rotation_State;
	cluster_paging_state!: Rotation_State;
	ring_resizing_state!: Expansion_State;
	rebuild_needed_byType: {[type: string]: boolean} = {};
	queryStrings = new URLSearchParams(window.location.search);

	setup() {
		
		//////////////////////////////////////////////
		// this is the first code called by the app //
		//////////////////////////////////////////////

		const isMobile = this.device_isMobile;
		debug.queryStrings_apply();						// debug even setup code
		this.applyScale(isMobile ? 2 : 1);				// defaults
		s_resize_count.set(0);
		s_rebuild_count.set(0);
		s_mouse_up_count.set(0);
		s_color_thing.set(null);
		s_device_isMobile.set(isMobile);
		this.cluster_paging_state = new Rotation_State();
		this.ring_rotation_state = new Rotation_State();
		this.ring_resizing_state = new Expansion_State();
		persistLocal.restore_state();					// local persistance
		persistLocal.restore_db();
		this.queryStrings_apply();						// query strings
		show.queryStrings_apply();
		this.subscribeTo_resizeEvents();				// setup to watch user
		events.setup();
	}

	subscribeTo_resizeEvents() {
		window.addEventListener('resize', (event) => {
			setTimeout(() => {
				const isMobile = this.device_isMobile;
				debug.log_action(` resize [is${isMobile ? '' : ' not'} mobile] STATE`);
				s_resize_count.set(get(s_resize_count) + 1);
				s_device_isMobile.set(isMobile);
				this.graphRect_update();
			}, 1);
		});
		window.addEventListener('orientationchange', () => {
			setTimeout(() => {
				const isMobile = this.device_isMobile;
				debug.log_action(` orientationchange [is${isMobile ? '' : ' not'} mobile] STATE`);
				s_device_isMobile.set(isMobile);
				this.graphRect_update();
			}, 1);
		});
	}

	queryStrings_apply() {
		const queryStrings = this.queryStrings;
        const disable = queryStrings.get('disable');
        const eraseOptions = queryStrings.get('erase')?.split(k.comma) ?? [];
		persistLocal.applyFor_key_name(IDPersistent.graph_type, (type: Graph_Type) => s_graph_type.set(type));
        if (disable) {
            const flags = disable.split(',');
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

	get windowScroll(): Point { return new Point(window.scrollX, window.scrollY); }
	get graph_center(): Point { return get(s_graphRect).size.dividedInHalf.asPoint; }

	get isAny_rotation_active(): boolean {
		return ux.isAny_paging_arc_active || this.cluster_paging_state.isActive || this.ring_rotation_state.isActive;
	}

	get next_mouse_responder_number(): number {
		this.mouse_responder_number += 1;
		return this.mouse_responder_number;
	}

	get windowSize(): Size {
		const ratio = this.scale_factor;
		return new Size(window.innerWidth / ratio, window.innerHeight / ratio);
	}

	get isServerLocal(): boolean {
		const hostname = window.location.hostname;
		return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0";
	}

	get windowDelta(): Point | null {
		const scroll = this.windowScroll;
		const delta = scroll.distanceFrom(this.scroll);
		if (delta.magnitude > 1) {
			this.scroll = scroll;
			return delta;
		}
		return null
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

	graphOffset_setTo(offset: Point): boolean {
		if (get(s_user_graphOffset) != offset) {
			persistLocal.write_key(IDPersistent.user_offset, offset);
			s_user_graphOffset.set(offset);
			return true;
		}
		return false;
	}

	graphRect_update() {
		const left = get(s_show_details) ? k.width_details : 0;			// width of details
		const originOfGraph = new Point(left, 69);						// 69 = height of content above the graph
		const sizeOfGraph = this.windowSize.reducedBy(originOfGraph);	// account for origin
		const rect = new Rect(originOfGraph, sizeOfGraph);
		debug.log_action(` graphRect_update ${rect.description} STATE`);
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
		this.scale_factor = scale;
		const zoomContainer = document.documentElement;
		zoomContainer.style.setProperty('zoom', scale.toString());
		zoomContainer.style.transform = `scale(var(zoom))`;
		zoomContainer.style.height = `${100 / scale}%`;
		zoomContainer.style.width = `${100 / scale}%`;
		this.graphRect_update();
	}

}

export let g = new Global_State();
