import { s_s_paging, s_ancestries_grabbed, s_ancestries_expanded } from '../state/S_Stores';
import { s_ancestry_focus, s_font_size, s_thing_fontFamily } from '../state/S_Stores';
import { s_hierarchy, s_t_tree, s_t_graph, s_t_details } from '../state/S_Stores';
import { s_ring_rotation_angle, s_ring_rotation_radius } from '../state/S_Stores';
import { g, k, show, debug, Ancestry, databases } from '../common/Global_Imports';
import { T_Tree, T_Graph, T_Details, S_Paging } from '../common/Global_Imports';
import { get } from 'svelte/store';

export enum T_Preference {
	relationships  = 'relationships',
	ring_radius	   = 'ring_radius',
	user_offset	   = 'user_offset',
	ring_angle     = 'ring_angle',
	arrowheads	   = 'arrowheads',
	t_details	   = 't_details',
	font_size	   = 'font_size',
	tiny_dots	   = 'tiny_dots',
	base_id		   = 'base_id',
	details		   = 'details',
	expanded	   = 'expanded',
	grabbed		   = 'grabbed',
	s_pages 	   = 's_pages',
	t_graph		   = 't_graph',
	t_info	       = 't_info',
	t_tree		   = 't_tree',
	traits		   = 'traits',
	scale		   = 'scale',
	focus		   = 'focus',
	local		   = 'local',
	info		   = 'info',
	font		   = 'font',
	db			   = 'db',
}

export class Preferences {
	// for backwards compatibility with {focus, grabbed, expanded} which were stored as relationship ids (not as ancestry string)
	usesRelationships		 = localStorage[T_Preference.relationships];
	ignoreAncestries		 = !this.usesRelationships || this.usesRelationships == 'undefined';

	read_key				(key: string): any | null { return this.parse(localStorage[key]); }
	write_key<T>			(key: string, value: T) { localStorage[key] = JSON.stringify(value); }
	writeDB_key<T>			(key: string, value: T) { this.write_key(this.db_keyFor(key), value); }
	readDB_key				(key: string): any | null { return this.read_key(this.db_keyFor(key)); }
	delete_s_paging_for (key: string) { this.writeDB_keyPair(T_Preference.s_pages, key, null); }
	db_keyFor				(key: string): string { return this.keyPair_for(databases.db.t_database, key); }
	keyPair_for				(key: string, sub_key: string): string { return `${key}${k.generic_separator}${sub_key}`; }

	reset() {
		const ids = Object.keys(T_Preference)
			.filter(key => isNaN(Number(key))) // Exclude numeric keys
			.map(key => T_Preference[key as keyof typeof T_Preference]);
		for (const id of ids) {
			if (id != 'local') {
				this.write_key(id, null);
			}
		}

	}

	parse(key: string | null): any | null {
		if (!key || key == 'undefined') {
			return null;
		}		
		return JSON.parse(key);
	}

	writeDB_keyPair<T>(key: string, sub_key: string, value: T): void {	// pair => key, sub_key
		const dbKey = this.db_keyFor(key);
		const sub_keys: Array<string> = this.read_key(dbKey) ?? [];
		const pair = this.keyPair_for(dbKey, sub_key);
		this.write_key(pair, value);			// first store the value by key pair
		if (sub_keys.length == 0 || !sub_keys.includes(sub_key)) {
			sub_keys.push(sub_key);
			this.write_key(dbKey, sub_keys);								// then store they sub key by key
		}
	}

	delete_sub_keys_forKey(key: string) {
		const dbKey = this.db_keyFor(key);
		const sub_keys: Array<string> = this.read_key(dbKey) ?? [];
		this.write_key(dbKey, null);
		for (const sub_key of sub_keys) {
			const pair = this.keyPair_for(dbKey, sub_key);
			this.write_key(pair, null);
		}
	}

	readDB_sub_keys_forKey(key: string): Array<any> {
		let values: Array<any> = [];
		const dbKey = this.db_keyFor(key);
		const sub_keys: Array<string> = this.read_key(dbKey) ?? [];
		for (const sub_key of sub_keys) {
			const value = this.read_key(this.keyPair_for(dbKey, sub_key));
			if (!!value) {												// ignore undefined or null
				values.push(value);
			}
		}
		return values;
	}

	ancestries_writeDB_key(ancestries: Array<Ancestry>, key: string) {
		const path_strings = ancestries.map(a => a.id);		// ancestry id is actually a path string (of Relationship ids)
		this.writeDB_key(key, ancestries.length == 0 ? null : path_strings);
		debug.log_preferences(`! ${key.toUpperCase()} ${ancestries.length} paths "${path_strings}" titles "${ancestries.map(a => a.title)}"`);
	}

	ancestries_readDB_key(key: string): Array<Ancestry> {	// 2 keys supported so far {grabbed, expanded}
		const aids = this.readDB_key(key);
		const length = aids?.length ?? 0;
		let ancestries: Array<Ancestry> = [];
		if (!this.ignoreAncestries && length > 0) {
			let h = get(s_hierarchy);
			for (const aid of aids) {
				const a = h.ancestry_valid_forID(aid);
				if (!!a) {
					ancestries.push(a);
				}
			};
		}
		debug.log_preferences(`  ${key.toUpperCase()} ${ancestries.map(a => a.id)}`);
		return ancestries;
	}

	reactivity_subscribe() {
		s_t_tree.subscribe((value) => {
			this.write_key(T_Preference.t_tree, value);
		});
		s_t_graph.subscribe((value) => {
			this.write_key(T_Preference.t_graph, value);
		});
		s_t_details.subscribe((value) => {
			this.write_key(T_Preference.t_details, value);
		});
		s_ring_rotation_angle.subscribe((angle: number) => {
			this.write_key(T_Preference.ring_angle, angle);
		});
		s_ring_rotation_radius.subscribe((radius: number) => {
			this.write_key(T_Preference.ring_radius, radius);
		});
		s_s_paging.subscribe((s_paging: S_Paging) => {
			if (!!s_paging) {
				this.writeDB_keyPair(T_Preference.s_pages, s_paging.sub_key, s_paging.description);
			}
		})
		show.reactivity_subscribe();
	}

	restore_defaults() {
		if (this.ignoreAncestries) {
			this.write_key(T_Preference.relationships, true);
		}
		s_font_size.set(this.read_key(T_Preference.font_size) ?? 14);
		s_ring_rotation_angle.set(this.read_key(T_Preference.ring_angle) ?? 0);
		s_t_graph.set(this.read_key(T_Preference.t_graph) ?? T_Graph.tree);
		s_t_tree.set(this.read_key(T_Preference.t_tree) ?? T_Tree.children);
		s_thing_fontFamily.set(this.read_key(T_Preference.font) ?? 'Times New Roman');
		s_t_details.set(this.read_key(T_Preference.t_details) ?? [T_Details.storage]);
		s_ring_rotation_radius.set(Math.max(this.read_key(T_Preference.ring_radius) ?? 0, k.innermost_ring_radius));
		this.reactivity_subscribe()
	}

	// not used!!!
	restore_s_pages() {
		const descriptions = this.readDB_sub_keys_forKey(T_Preference.s_pages) ?? k.empty;
		for (const description of descriptions) {
			const s_paging = S_Paging.create_s_paging_from(description);
			if (!!s_paging) {
				const thing = s_paging?.thing;
				if (!!thing) {
					thing.s_pages.add_s_paging(s_paging);
				} else {															// if no thing => delete paging state
					preferences.delete_s_paging_for(s_paging.sub_key);
				}
			}
		}
	}

	restore_grabbed_andExpanded(force: boolean = false) {
		if (g.eraseDB > 0) {
			g.eraseDB -= 1;
			s_ancestries_expanded.set([]);
			s_ancestries_grabbed.set([get(s_hierarchy).rootAncestry]);
		} else {
			s_ancestries_grabbed.set(this.ancestries_readDB_key(T_Preference.grabbed));
			s_ancestries_expanded.set(this.ancestries_readDB_key(T_Preference.expanded));
		}
		setTimeout(() => {
			const threshold = 0;
			let grabbed_count = 0;
			let expanded_count = 0;
			s_ancestries_grabbed.subscribe((array: Array<Ancestry>) => {
				if (grabbed_count > threshold) {
					this.ancestries_writeDB_key(array, T_Preference.grabbed);
				}
				grabbed_count += 1;
			});
			s_ancestries_expanded.subscribe((array: Array<Ancestry>) => {
				if (expanded_count > threshold) {
					this.ancestries_writeDB_key(array, T_Preference.expanded);
				}
				expanded_count += 1;
			});
		}, 100);
	}

	restore_focus() {
		const h = get(s_hierarchy);
		let ancestryToFocus = h.rootAncestry;
		if (!this.ignoreAncestries && !g.eraseDB) {
			const focusid = this.readDB_key(T_Preference.focus);
			if (!!focusid || focusid == k.empty) {
				const focusAncestry = h.ancestry_remember_createUnique(focusid);
				if (!!focusAncestry) {
					ancestryToFocus = focusAncestry;
				}
			}
		}
		if (!ancestryToFocus.thing) {
			const lastGrabbedAncestry = h.grabs_latest_ancestry?.parentAncestry;
			if (lastGrabbedAncestry) {
				ancestryToFocus = lastGrabbedAncestry;
			}
		}
		ancestryToFocus.becomeFocus(true);
		s_ancestry_focus.subscribe((ancestry: Ancestry) => {
			this.writeDB_key(T_Preference.focus, !ancestry ? null : ancestry.id);
		});
	}

}

export const preferences = new Preferences();
