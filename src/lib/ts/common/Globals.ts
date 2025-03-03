import { e, k, p, u, ux, w, show, debug, databases } from './Global_Imports';
import { Hierarchy, S_Rotation, S_Expansion } from './Global_Imports';
import { T_Graph, T_Preference } from './Global_Imports';
import { stores, w_t_graph, w_hierarchy } from '../managers/Stores';
import { get } from 'svelte/store';

export class Globals {
	allow_GraphEditing = true;
	allow_TitleEditing = true;
	allow_HorizontalScrolling = true;

	eraseDB = 0;
	isEditing_text = false;
	mouse_responder_number = 0;
	s_ring_rotation!: S_Rotation;
	s_ring_resizing!: S_Expansion;
	s_cluster_rotation!: S_Rotation;
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
		p.restore_defaults();
		databases.restore_db();
		this.queryStrings_apply();						// query string
		show.queryStrings_apply();
		e.setup();
	}

	setup_defaults() {
		stores.setup_defaults();
		this.s_ring_resizing = new S_Expansion();
		this.s_ring_rotation  = new S_Rotation();
		this.s_cluster_rotation = new S_Rotation();
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
				case 'settings':
					p.preferences_reset();
					stores.reset_settings();
					break;
				case 'data':
					this.eraseDB = 2;
					p.writeDB_key(T_Preference.focus, null);
					p.writeDB_key(T_Preference.grabbed, null);
					p.writeDB_key(T_Preference.expanded, null);
					break;
			}
		}
    }

	get inRadialMode(): boolean { return get(w_t_graph) == T_Graph.radial; }
	get hierarchy(): Hierarchy { return get(w_hierarchy); }

	get isAny_rotation_active(): boolean {
		return ux.isAny_paging_arc_active || this.s_cluster_rotation.isActive || this.s_ring_rotation.isActive;
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
		const t_database = databases.db_now.t_database;
		const idBase = databases.db_now.idBase;
		const host = this.isServerLocal ? 'local' : 'remote';
		const db_name = t_database ? (t_database! + ', ') : k.empty;
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

export let g = new Globals();
