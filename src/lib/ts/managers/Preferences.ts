import { s_paging_state, s_ancestries_grabbed, s_ancestries_expanded } from '../state/S_Stores';
import { s_hierarchy, s_tree_type, s_graph_type, s_detail_types } from '../state/S_Stores';
import { T_Tree, T_Graph, T_Details, S_Paging } from '../common/Global_Imports';
import { s_ancestry_focus, s_font_size, s_thing_fontFamily } from '../state/S_Stores';
import { s_ring_rotation_angle, s_ring_rotation_radius } from '../state/S_Stores';
import { g, k, show, debug, Ancestry, databases } from '../common/Global_Imports';
import { get } from 'svelte/store';

export enum T_Preference {
	relationships  = 'relationships',
	details_type   = 'details_type',
	ring_radius	   = 'ring_radius',
	page_states    = 'page_states',
	user_offset	   = 'user_offset',
	graph_type	   = 'graph_type',
	ring_angle     = 'ring_angle',
	arrowheads	   = 'arrowheads',
	tree_type	   = 'tree_type',
	info_type      = 'info_type',
	font_size	   = 'font_size',
	tiny_dots	   = 'tiny_dots',
	expanded	   = 'expanded',
	grabbed		   = 'grabbed',
	details		   = 'details',
	base_id		   = 'base_id',
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
	writeDB_key<T>			(key: string, value: T) { this.write_key(this.dbKey_for(key), value); }
	readDB_key				(key: string): any | null { return this.read_key(this.dbKey_for(key)); }
	dbKey_for				(key: string): string { return this.keyPair_for(databases.db.type_db, key); }
	delete_paging_state_for (key: string) { this.write_keyPair(this.dbKey_for(T_Preference.page_states), key, null); }
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

	write_keyPair<T>(key: string, sub_key: string, value: T): void {	// pair => key, sub_key
		const sub_keys: Array<string> = this.read_key(key) ?? [];
		const pair = this.keyPair_for(key, sub_key);
		this.write_key(pair, value);			// first store the value by key pair
		if (sub_keys.length == 0 || !sub_keys.includes(sub_key)) {
			sub_keys.push(sub_key);
			this.write_key(key, sub_keys);								// then store they sub key by key
		}
	}

	delete_sub_keys_forKey(key: string) {
		const sub_keys: Array<string> = this.read_key(key) ?? [];
		this.write_key(key, null);
		for (const sub_key of sub_keys) {
			const pair = this.keyPair_for(key, sub_key);
			this.write_key(pair, null);
		}
	}

	read_sub_keys_forKey(key: string): Array<any> {
		let values: Array<any> = [];
		const sub_keys: Array<string> = this.read_key(key) ?? [];
		for (const sub_key of sub_keys) {
			const value = this.read_key(this.keyPair_for(key, sub_key));
			if (!!value) {												// ignore undefined or null
				values.push(value);
			}
		}
		return values;
	}

	ancestries_forKey(key: string): Array<Ancestry> {	// 2 keys supported so far {grabbed, expanded}
		const aids = this.read_key(key);
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
		return ancestries;
	}

	reactivity_subscribe() {
		s_ring_rotation_radius.subscribe((radius: number) => {
			this.write_key(T_Preference.ring_radius, radius);
		});
		s_tree_type.subscribe((value) => {
			this.write_key(T_Preference.tree_type, value);
		});
		s_graph_type.subscribe((value) => {
			this.write_key(T_Preference.graph_type, value);
		});
		s_detail_types.subscribe((value) => {
			this.write_key(T_Preference.details_type, value);
		});
		s_ring_rotation_angle.subscribe((angle: number) => {
			this.write_key(T_Preference.ring_angle, angle);
		});
		s_paging_state.subscribe((paging_state: S_Paging) => {
			if (!!paging_state) {
				const dbKey = this.dbKey_for(T_Preference.page_states);
				this.write_keyPair(dbKey, paging_state.sub_key, paging_state.description);
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
		s_graph_type.set(this.read_key(T_Preference.graph_type) ?? T_Graph.tree);
		s_tree_type.set(this.read_key(T_Preference.tree_type) ?? T_Tree.children);
		s_thing_fontFamily.set(this.read_key(T_Preference.font) ?? 'Times New Roman');
		s_detail_types.set(this.read_key(T_Preference.details_type) ?? [T_Details.storage]);
		s_ring_rotation_radius.set(Math.max(this.read_key(T_Preference.ring_radius) ?? 0, k.innermost_ring_radius));
		this.reactivity_subscribe()
	}

	// not used!!!
	restore_page_states() {
		const descriptions = this.read_sub_keys_forKey(this.dbKey_for(T_Preference.page_states)) ?? k.empty;
		for (const description of descriptions) {
			const paging_state = S_Paging.create_paging_state_from(description);
			if (!!paging_state) {
				const thing = paging_state?.thing;
				if (!!thing) {
					thing.page_states.add_paging_state(paging_state);
				} else {															// if no thing => delete paging state
					preferences.delete_paging_state_for(paging_state.sub_key);
				}
			}
		}
	}

	restore_grabbed_andExpanded(force: boolean = false) {
		const h = get(s_hierarchy);
		const root = [h.rootAncestry];
		const erase = g.eraseDB;
		const expanded = erase ? [] : this.ancestries_forKey(this.dbKey_for(T_Preference.expanded));
		const grabbed = erase ? root : this.ancestries_forKey(this.dbKey_for(T_Preference.grabbed)) ?? root;
		s_ancestries_grabbed.set(grabbed);
		debug.log_persist(`^ GRABBED ${grabbed.map(a => a.title)}`);
		s_ancestries_expanded.set(expanded);
		debug.log_persist(`^ EXPANDED ${expanded.map(a => a.title)}`);
		setTimeout(() => {
			s_ancestries_grabbed.subscribe((g: Array<Ancestry>) => {
				debug.log_persist(`  GRABBED ${g.map(a => a.title)}`);
				this.writeDB_key(T_Preference.grabbed, !g ? null : g.map(a => a.id));		// ancestral paths
			});
			s_ancestries_expanded.subscribe((e: Array<Ancestry>) => {
				debug.log_persist(`  EXPANDED ${e.map(a => a.title)}`);
				this.writeDB_key(T_Preference.expanded, !e ? null : e.map(a => a.id));		// ancestral paths
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
			const lastGrabbedAncestry = h.grabs.ancestry_lastGrabbed?.parentAncestry;
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
