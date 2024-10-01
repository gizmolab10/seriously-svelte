import { s_show_rings, s_paging_state, s_thing_fontFamily } from '../state/Reactive_State';
import { s_rotation_ring_angle, s_rotation_ring_radius } from '../state/Reactive_State';
import { s_grabbed_ancestries, s_expanded_ancestries } from '../state/Reactive_State';
import { g, k, get, show, Point, debug, Ancestry } from '../common/Global_Imports';
import { s_focus_ancestry, s_user_graphOffset } from '../state/Reactive_State';
import { dbDispatch, Paging_State } from '../common/Global_Imports';
import { h } from '../db/DBDispatch';

export enum IDPersistent {
	relationships = 'relationships',
	title_atTop   = 'title_atTop',
	ring_radius	  = 'ring_radius',
	page_states   = 'page_states',
	ring_angle    = 'ring_angle',
	info_kind     = 'info_kind',
	arrowheads	  = 'arrowheads',
	relations	  = 'relations',
	expanded	  = 'expanded',
	controls	  = 'controls',
	tinyDots	  = 'tinyDots',
	grabbed		  = 'grabbed',
	details		  = 'details',
	base_id		  = 'base_id',
	layout		  = 'layout',
	origin		  = 'origin',
	quests		  = 'quests',
	scale		  = 'scale',
	focus		  = 'focus',
	info		  = 'info',
	font		  = 'font',
	db			  = 'db',
}

class Persist_Local {
	// for backwards compatibility with {focus, grabbed, expanded} which were stored as relationship ids (not as ancestry strings)
	usesRelationships	= localStorage[IDPersistent.relationships];
	ignoreAncestries	= !this.usesRelationships || this.usesRelationships == 'undefined';
	ancestriesRestored	= false;

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

	applyFor_key_name(key: string, matching: string, apply: (flag: boolean) => void, persist: boolean = true) {
		const queryStrings = g.queryStrings;
        const value = queryStrings.get(key);
		if (!!value) {
			const flag = (value === matching);
			apply(flag);
			if (persist) {
				this.write_key(key, flag);
			}
		}
	}

	ancestries_forKey(key: string): Array<Ancestry> {		// 2 keys supported so far: grabbed, expanded
		const dbKey = this.dbKey_for(key);
		const ids = this.read_key(dbKey);
		const length = ids?.length ?? 0;
		if (this.ignoreAncestries || !ids || length == 0) {
			return [];
		}
		let needsRewrite = false;
		const ancestries: Array<Ancestry> = [];
		const reversed = ids.reverse();
		reversed.forEach((id: string, index: number) => {
			const predicateID = h.idPredicate_for(id);
			const ancestry = h.ancestry_remember_createUnique(id, predicateID);
			if (!ancestry) {
				ids.slice(1, length - index);
				needsRewrite = true;
			} else {
				for (const id of ancestry.ids) {
					const relationship = h.relationship_forHID(id.hash());
					if (!relationship) {
						ids.slice(1, length - index);
						needsRewrite = true;
						break;
					}
				}
			}
			if (!needsRewrite && ancestry) {
				ancestries.push(ancestry);
			}
		});
		if (needsRewrite) {
			this.write_key(key, ids);
		}
		return ancestries;
	}

	reactivity_subscribe() {
		s_rotation_ring_radius.subscribe((radius: number) => {
			this.write_key(IDPersistent.ring_radius, radius);
		});
		s_show_rings.subscribe((flag: boolean) => {
			this.write_key(IDPersistent.layout, flag);
		});
		s_rotation_ring_angle.subscribe((angle: number) => {
			this.write_key(IDPersistent.ring_angle, angle);
		});
		show.reactivity_subscribe();
	}

	restore_graphOffset() {
		let offset = Point.zero;
		const stored = this.read_key(IDPersistent.origin);
		if (!!stored) {
			offset = new Point(stored.x, stored.y);
		}
		s_user_graphOffset.set(offset);
	}

	restore_db() {
		const type = persistLocal.read_key(IDPersistent.db) ?? 'firebase';
		(async () => {
			dbDispatch.hierarchy_fetch_andBuild_forDBType(type);
		})();
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
		show.restore_state();
		g.applyScale(!g.device_isMobile ? 1 : this.read_key(IDPersistent.scale) ?? 1);
		s_rotation_ring_angle.set(this.read_key(IDPersistent.ring_angle) ?? 0);
		s_thing_fontFamily.set(this.read_key(IDPersistent.font) ?? 'Times New Roman');
		s_show_rings.set(this.read_key(IDPersistent.layout) ?? false);
		s_rotation_ring_radius.set(Math.max(this.read_key(IDPersistent.ring_radius) ?? 0, k.ring_smallest_radius));
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
		if (!this.ancestriesRestored || force) {
			this.ancestriesRestored = true;
			s_grabbed_ancestries.set(this.ancestries_forKey(IDPersistent.grabbed));
			debug.log_persist(`- GRABBED ${get(s_grabbed_ancestries).map(a => a.title)}`);
			s_expanded_ancestries.set(this.ancestries_forKey(IDPersistent.expanded));
			debug.log_persist(`- EXPANDED ${get(s_expanded_ancestries).map(a => a.title)}`);
			setTimeout(() => {
				s_grabbed_ancestries.subscribe((ancestries: Array<Ancestry>) => {
					debug.log_persist(`  GRABBED ${ancestries.map(a => a.title)}`);
					this.write_key(this.dbKey_for(IDPersistent.grabbed), !ancestries ? null : ancestries.map(a => a.id));		// ancestral paths
				});
				s_expanded_ancestries.subscribe((ancestries: Array<Ancestry>) => {
					debug.log_persist(`  EXPANDED ${ancestries.map(a => a.title)}`);
					this.write_key(this.dbKey_for(IDPersistent.expanded), !ancestries ? null : ancestries.map(a => a.id));	// ancestral paths
				});
			}, 100);
		}
	}

	restore_focus() {
		h.rootAncestry_setup();
		let ancestryToFocus = h.rootAncestry;
		if (!this.ignoreAncestries) {
			const focusid = this.readDB_key(IDPersistent.focus);
			if (focusid) {
				const focusAncestry = h.ancestry_remember_createUnique(focusid);
				if (focusAncestry) {
					ancestryToFocus = focusAncestry;
				}
			}
		}
		let focus = h.thing_forAncestry(ancestryToFocus);
		if (focus == null) {
			const lastGrabbedAncestry = h.grabs.ancestry_lastGrabbed?.parentAncestry;
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
