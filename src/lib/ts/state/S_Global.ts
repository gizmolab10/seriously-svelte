import { s_graph_type, s_thing_color, s_startup_state, s_device_isMobile } from './S_Stores';
import { s_hierarchy, s_resize_count, s_mouse_up_count, s_rebuild_count } from './S_Stores';
import { Hierarchy, T_Graph, preferences, T_Preference } from '../common/Global_Imports';
import { S_Rotation, T_Startup, S_Expansion } from '../common/Global_Imports';
import { e, k, u, ux, w, show, debug, databases } from '../common/Global_Imports';
import { s_grabbed_ancestries, s_expanded_ancestries } from './S_Stores';
import { s_focus_ancestry } from './S_Stores';
import { get } from 'svelte/store';

class S_Global {
	allow_GraphEditing = true;
	allow_TitleEditing = true;
	allow_HorizontalScrolling = true;

	eraseDB = false;
	isEditing_text = false;
	mouse_responder_number = 0;
	ring_rotation_state!: S_Rotation;
	cluster_paging_state!: S_Rotation;
	ring_resizing_state!: S_Expansion;
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
		preferences.restore_defaults();
		databases.restore_db();
		this.queryStrings_apply();						// query string
		show.queryStrings_apply();
		e.setup();
	}

	setup_defaults() {
		s_resize_count.set(0);
		s_rebuild_count.set(0);
		s_mouse_up_count.set(0);
		s_thing_color.set(null);
		s_startup_state.set(T_Startup.start);
		s_device_isMobile.set(this.device_isMobile);
		this.ring_resizing_state = new S_Expansion();
		this.ring_rotation_state  = new S_Rotation();
		this.cluster_paging_state = new S_Rotation();
	}

	queryStrings_apply() {
		const queryStrings = this.queryStrings;
        const eraseOptions = queryStrings.get('erase')?.split(k.comma) ?? [];
        const disableOptions = queryStrings.get('disable')?.split(k.comma) ?? [];
		for (const option of disableOptions) {
			switch (option) {
				case 'editGraph':			this.allow_GraphEditing		   = false; break;
				case 'editTitles':			this.allow_TitleEditing		   = false; break;
				case 'horizontalScrolling': this.allow_HorizontalScrolling = false; break;
			}
		}
		for (const option of eraseOptions) {
			switch (option) {
				case 'data':
					this.eraseDB = true;
					preferences.writeDB_key(T_Preference.focus, null);
					preferences.writeDB_key(T_Preference.expanded, null); 
					break;
				case 'settings':
					preferences.reset();
					s_expanded_ancestries.set([]);
					s_focus_ancestry.set(this.hierarchy.rootAncestry);
					s_grabbed_ancestries.set([this.hierarchy.rootAncestry]);
					break;
			}
		}
    }

	get inRadialMode(): boolean { return get(s_graph_type) == T_Graph.radial; }
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
		const type_db = databases.db.type_db;
		const idBase = databases.db.idBase;
		const host = this.isServerLocal ? 'local' : 'remote';
		const db_name = type_db ? (type_db! + ', ') : k.empty;
		const base_name = idBase ? (idBase! + ', ') : k.empty;
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

export let g = new S_Global();
