import { s_paging_state, s_grabbed_ancestries, s_expanded_ancestries } from '../state/Svelte_Stores';
import { s_hierarchy, s_tree_type, s_graph_type, s_detail_types } from '../state/Svelte_Stores';
import { Tree_Type, Graph_Type, Details_Type, Paging_State } from '../common/Global_Imports';
import { s_focus_ancestry, s_font_size, s_thing_fontFamily } from '../state/Svelte_Stores';
import { s_rotation_ring_angle, s_ring_rotation_radius } from '../state/Svelte_Stores';
import { k, show, debug, Ancestry, dbDispatch } from '../common/Global_Imports';
import { get } from 'svelte/store';

export enum IDPersistent {
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
	expanded	   = 'expanded',
	tinyDots	   = 'tinyDots',
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

class Persist_Local {
	// for backwards compatibility with {focus, grabbed, expanded} which were stored as relationship ids (not as ancestry strings)
	usesRelationships		 = localStorage[IDPersistent.relationships];
	ignoreAncestries		 = !this.usesRelationships || this.usesRelationships == 'undefined';
	grabs_expandeds_restored = false;

	read_key				(key: string): any | null { return this.parse(localStorage[key]); }
	write_key<T>			(key: string, value: T) { localStorage[key] = JSON.stringify(value); }
	writeDB_key<T>			(key: string, value: T) { this.write_key(this.dbKey_for(key), value); }
	readDB_key				(key: string): any | null { return this.read_key(this.dbKey_for(key)); }
	dbKey_for				(key: string): string { return this.keyPair_for(dbDispatch.db.dbType, key); }
	delete_paging_state_for (key: string) { this.write_keyPair(this.dbKey_for(IDPersistent.page_states), key, null); }
	keyPair_for				(key: string, sub_key: string): string { return `${key}${k.generic_separator}${sub_key}`; }

	reset() {
		const ids = Object.keys(IDPersistent)
			.filter(key => isNaN(Number(key))) // Exclude numeric keys
			.map(key => IDPersistent[key as keyof typeof IDPersistent]);
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

	ancestry_forID(aid: string): Ancestry {
		const h = get(s_hierarchy);
		const rids = aid.split(k.generic_separator);	// ancestor id is multiple relationship ids separated by generic_separator
		const rid = rids.slice(-1)[0];					// grab last relationship id
		const predicateID = h.idPredicate_for(rid);		// grab its predicate id
		return h.ancestry_remember_createUnique(aid, predicateID);
	}

	ancestries_forKey(key: string): Array<Ancestry> {	// 2 keys supported so far {grabbed, expanded}
		const aids = this.read_key(key);
		const length = aids?.length ?? 0;
		if (!this.ignoreAncestries && length > 0) {
			let ancestries: Array<Ancestry> = [];
			for (const aid of aids) {
				ancestries.push(this.ancestry_forID(aid));
			};
			return ancestries;
		}
		return [];
	}

	reactivity_subscribe() {
		s_ring_rotation_radius.subscribe((radius: number) => {
			this.write_key(IDPersistent.ring_radius, radius);
		});
		s_tree_type.subscribe((value) => {
			this.write_key(IDPersistent.tree_type, value);
		});
		s_graph_type.subscribe((value) => {
			this.write_key(IDPersistent.graph_type, value);
		});
		s_detail_types.subscribe((value) => {
			this.write_key(IDPersistent.details_type, value);
		});
		s_rotation_ring_angle.subscribe((angle: number) => {
			this.write_key(IDPersistent.ring_angle, angle);
		});
		s_paging_state.subscribe((paging_state: Paging_State) => {
			if (!!paging_state) {
				const dbKey = this.dbKey_for(IDPersistent.page_states);
				this.write_keyPair(dbKey, paging_state.sub_key, paging_state.description);
			}
		})
		show.reactivity_subscribe();
	}

	restore_defaults() {
		if (this.ignoreAncestries) {
			this.write_key(IDPersistent.relationships, true);
		}
		s_font_size.set(this.read_key(IDPersistent.font_size) ?? 14);
		s_rotation_ring_angle.set(this.read_key(IDPersistent.ring_angle) ?? 0);
		s_graph_type.set(this.read_key(IDPersistent.graph_type) ?? Graph_Type.tree);
		s_tree_type.set(this.read_key(IDPersistent.tree_type) ?? Tree_Type.children);
		s_thing_fontFamily.set(this.read_key(IDPersistent.font) ?? 'Times New Roman');
		s_detail_types.set(this.read_key(IDPersistent.details_type) ?? [Details_Type.storage]);
		s_ring_rotation_radius.set(Math.max(this.read_key(IDPersistent.ring_radius) ?? 0, k.innermost_ring_radius));
		this.reactivity_subscribe()
	}

	// not used!!!
	restore_page_states() {
		const descriptions = this.read_sub_keys_forKey(this.dbKey_for(IDPersistent.page_states)) ?? k.empty;
		for (const description of descriptions) {
			const paging_state = Paging_State.create_paging_state_from(description);
			if (!!paging_state) {
				const thing = paging_state?.thing;
				if (!!thing) {
					thing.page_states.add_paging_state(paging_state);
				} else {															// if no thing => delete paging state
					persistLocal.delete_paging_state_for(paging_state.sub_key);
				}
			}
		}
	}

	restore_grabbed_andExpanded(force: boolean = false) {
		const h = get(s_hierarchy);
		if (!this.grabs_expandeds_restored || force) {
			this.grabs_expandeds_restored = true;
			const grabbed = this.ancestries_forKey(this.dbKey_for(IDPersistent.grabbed)) ?? [h.rootAncestry];
			const expanded = this.ancestries_forKey(this.dbKey_for(IDPersistent.expanded));
			s_grabbed_ancestries.set(grabbed);
			debug.log_persist(`^ GRABBED ${grabbed.map(a => a.title)}`);
			s_expanded_ancestries.set(expanded);
			debug.log_persist(`^ EXPANDED ${expanded.map(a => a.title)}`);
			setTimeout(() => {
				s_grabbed_ancestries.subscribe((g: Array<Ancestry>) => {
					debug.log_persist(`  GRABBED ${g.map(a => a.title)}`);
					this.writeDB_key(IDPersistent.grabbed, !g ? null : g.map(a => a.id));		// ancestral paths
				});
				s_expanded_ancestries.subscribe((e: Array<Ancestry>) => {
					debug.log_persist(`  EXPANDED ${e.map(a => a.title)}`);
					this.writeDB_key(IDPersistent.expanded, !e ? null : e.map(a => a.id));	// ancestral paths
				});
			}, 100);
		}
	}

	restore_focus() {
		const h = get(s_hierarchy);
		h.setup_rootAncestry();
		let ancestryToFocus = h.rootAncestry;
		if (!this.ignoreAncestries) {
			const focusid = this.readDB_key(IDPersistent.focus);
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
		s_focus_ancestry.subscribe((ancestry: Ancestry) => {
			this.writeDB_key(IDPersistent.focus, !ancestry ? null : ancestry.id);
		});
	}

}

export const persistLocal = new Persist_Local();
