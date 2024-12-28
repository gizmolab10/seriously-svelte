import { s_graph_type, s_thing_color, s_startup_state, s_device_isMobile } from './Svelte_Stores';
import { s_hierarchy, s_resize_count, s_mouse_up_count, s_rebuild_count } from './Svelte_Stores';
import { Hierarchy, Graph_Type, persistLocal, IDPersistent } from '../common/Global_Imports';
import { Rotation_State, Startup_State, Expansion_State } from '../common/Global_Imports';
import { e, k, u, ux, w, show, debug, dbDispatch } from '../common/Global_Imports';
import { s_grabbed_ancestries, s_expanded_ancestries } from './Svelte_Stores';
import { s_focus_ancestry } from './Svelte_Stores';
import { get } from 'svelte/store';

class Global_State {
	allow_GraphEditing = true;
	allow_TitleEditing = true;
	allow_HorizontalScrolling = true;

	isEditing_text = false;
	mouse_responder_number = 0;
	ring_rotation_state!: Rotation_State;
	cluster_paging_state!: Rotation_State;
	ring_resizing_state!: Expansion_State;
	rebuild_needed_byType: {[type: string]: boolean} = {};
	queryStrings = new URLSearchParams(window.location.search);

	startup() {
		
		//////////////////////////////////////////////////
		//												//
		//												//
		//	 this is the first code called by the app	//
		//												//
		//												//
		//////////////////////////////////////////////////

		debug.queryStrings_apply();						// debug even setup code
		this.setup_defaults();							// defaults
		w.restore_state();
		show.restore_state();							// local persistance
		persistLocal.restore_defaults();
		dbDispatch.restore_db();
		this.queryStrings_apply();						// query strings
		show.queryStrings_apply();
		e.setup();
	}

	setup_defaults() {
		s_resize_count.set(0);
		s_rebuild_count.set(0);
		s_mouse_up_count.set(0);
		s_thing_color.set(null);
		s_startup_state.set(Startup_State.start);
		s_device_isMobile.set(this.device_isMobile);
		this.ring_resizing_state = new Expansion_State();
		this.ring_rotation_state  = new Rotation_State();
		this.cluster_paging_state = new Rotation_State();
	}

	queryStrings_apply() {
		const queryStrings = this.queryStrings;
        const disable = queryStrings.get('disable');
        const eraseOptions = queryStrings.get('erase')?.split(k.comma) ?? [];
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
					persistLocal.writeDB_key(IDPersistent.focus, null);
					persistLocal.writeDB_key(IDPersistent.expanded, null); 
					break;
				case 'settings':
					persistLocal.reset();
					s_expanded_ancestries.set([]);
					s_focus_ancestry.set(this.hierarchy.rootAncestry);
					s_grabbed_ancestries.set([this.hierarchy.rootAncestry]);
					break;
			}
		}
    }

	get showing_rings(): boolean { return get(s_graph_type) == Graph_Type.rings; }
	get hierarchy(): Hierarchy { return get(s_hierarchy); }

	get isAny_rotation_active(): boolean {
		return ux.isAny_paging_arc_active || this.cluster_paging_state.isActive || this.ring_rotation_state.isActive;
	}

	get next_mouse_responder_number(): number {
		this.mouse_responder_number += 1;
		return this.mouse_responder_number;
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
	require_rebuild_forType(type: string) { this.rebuild_needed_byType[type] = true; }
	showHelp() { this.open_tabFor(this.isServerLocal ? k.local_help_url : k.remote_help_url); }

	readOnce_rebuild_needed_forType(type: string) : boolean {
		const needed = this.rebuild_needed_byType[type];
		this.rebuild_needed_byType[type] = false;
		return needed;
	}

}

export let g = new Global_State();
