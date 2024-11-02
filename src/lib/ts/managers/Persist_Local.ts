import { s_hierarchy, s_db_type, s_tree_type, s_graph_type, s_paging_state } from '../state/Reactive_State';
import { s_user_graphOffset, s_grabbed_ancestries, s_expanded_ancestries } from '../state/Reactive_State';
import { s_focus_ancestry, s_thing_fontSize, s_thing_fontFamily } from '../state/Reactive_State';
import { Tree_Type, Graph_Type, dbDispatch, Paging_State } from '../common/Global_Imports';
import { s_rotation_ring_angle, s_ring_rotation_radius } from '../state/Reactive_State';
import { k, get, show, Point, debug, Ancestry } from '../common/Global_Imports';

export enum IDPersistent {
	relationships  = 'relationships',
	ring_radius	   = 'ring_radius',
	page_states    = 'page_states',
	user_offset	   = 'user_offset',
	graph_type	   = 'graph_type',
	focus_info     = 'focus_info',
	ring_angle     = 'ring_angle',
	arrowheads	   = 'arrowheads',
	tree_type	   = 'tree_type',
	font_size	   = 'font_size',
	expanded	   = 'expanded',
	tinyDots	   = 'tinyDots',
	grabbed		   = 'grabbed',
	details		   = 'details',
	base_id		   = 'base_id',
	traits		   = 'traits',
	scale		   = 'scale',
	focus		   = 'focus',
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
		const rids = aid.split(k.generic_separator);	// ancestor id is multiple relationship ids separated by generic_separator
		const rid = rids.slice(-1)[0];					// grab last relationship id
		const predicateID = get(s_hierarchy).idPredicate_for(rid);		// grab its predicate id
		return get(s_hierarchy).ancestry_remember_createUnique(aid, predicateID);
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
		s_rotation_ring_angle.subscribe((angle: number) => {
			this.write_key(IDPersistent.ring_angle, angle);
		});
		show.reactivity_subscribe();
	}

	restore_graphOffset() {
		let offset = Point.zero;
		const stored = this.read_key(IDPersistent.user_offset);
		if (!!stored) {
			offset = new Point(stored.x, stored.y);
		}
		s_user_graphOffset.set(offset);
	}

	restore_db() {
		const type = persistLocal.read_key(IDPersistent.db) ?? 'firebase';
		s_db_type.set(type);
	}

	restore_db_dependent(force: boolean) {
		this.restore_grabbed_andExpanded(force);
		this.restore_focus();
		s_paging_state.subscribe((paging_state: Paging_State) => {
			if (!!paging_state) {
				const dbKey = this.dbKey_for(IDPersistent.page_states);
				this.write_keyPair(dbKey, paging_state.sub_key, paging_state.description);
			}
		})
	}

	restore_state() {
		if (this.ignoreAncestries) {
			this.write_key(IDPersistent.relationships, true);
		}
		s_thing_fontSize.set(this.read_key(IDPersistent.font_size) ?? 14);
		s_rotation_ring_angle.set(this.read_key(IDPersistent.ring_angle) ?? 0);
		s_graph_type.set(this.read_key(IDPersistent.graph_type) ?? Graph_Type.tree);
		s_tree_type.set(this.read_key(IDPersistent.tree_type) ?? Tree_Type.children);
		s_thing_fontFamily.set(this.read_key(IDPersistent.font) ?? 'Times New Roman');
		s_ring_rotation_radius.set(Math.max(this.read_key(IDPersistent.ring_radius) ?? 0, k.innermost_ring_radius));
		this.restore_graphOffset();
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
		if (!this.grabs_expandeds_restored || force) {
			this.grabs_expandeds_restored = true;
			const grabbed = this.ancestries_forKey(this.dbKey_for(IDPersistent.grabbed));
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
		get(s_hierarchy).rootAncestry_setup();
		let ancestryToFocus = get(s_hierarchy).rootAncestry;
		if (!this.ignoreAncestries) {
			const focusid = this.readDB_key(IDPersistent.focus);
			if (!!focusid || focusid == k.empty) {
				const focusAncestry = get(s_hierarchy).ancestry_remember_createUnique(focusid);
				if (!!focusAncestry) {
					ancestryToFocus = focusAncestry;
				}
			}
		}
		if (!get(s_hierarchy).thing_forAncestry(ancestryToFocus)) {
			const lastGrabbedAncestry = get(s_hierarchy).grabs.ancestry_lastGrabbed?.parentAncestry;
			if (lastGrabbedAncestry) {
				ancestryToFocus = lastGrabbedAncestry;
			}
		}
		ancestryToFocus.becomeFocus();
		s_focus_ancestry.subscribe((ancestry: Ancestry) => {
			this.writeDB_key(IDPersistent.focus, !ancestry ? null : ancestry.id);
		});
	}

}

export const persistLocal = new Persist_Local();
