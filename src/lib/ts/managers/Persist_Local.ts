import { s_rotation_ring_angle, s_rotation_ring_radius, s_cluster_mode } from '../state/Reactive_State';
import { s_ancestry_focus, s_show_details, s_user_graphOffset } from '../state/Reactive_State';
import { s_paging_state, s_thing_fontFamily, s_shown_relations } from '../state/Reactive_State';
import { g, k, get, Point, signals, Ancestry, dbDispatch } from '../common/Global_Imports';
import { s_ancestries_grabbed, s_ancestries_expanded } from '../state/Reactive_State';
import { Paging_State, Page_States, GraphRelations } from '../common/Global_Imports';
import { h } from '../db/DBDispatch';

export enum IDPersistant {
	relationships = 'relationships',
	show_children = 'show_children',
	title_atTop   = 'title_atTop',
	cluster_arc	  = 'cluster_arc',
	page_states   = 'page_states',
	ring_angle    = 'ring_angle',
	arrowheads	  = 'arrowheads',
	relations	  = 'relations',
	expanded	  = 'expanded',
	controls	  = 'controls',
	tinyDots	  = 'tinyDots',
	grabbed		  = 'grabbed',
	details		  = 'details',
	cluster		  = 'cluster',
	layout		  = 'layout',
	origin		  = 'origin',
	scale		  = 'scale',
	focus		  = 'focus',
	font		  = 'font',
	db			  = 'db',
}

class Persist_Local {
	// for backwards compatibility with {focus, grabbed, expanded} which were stored as relationship ids (not as ancestry strings)
	usesRelationships	= localStorage[IDPersistant.relationships];
	ignoreAncestries	= !this.usesRelationships || this.usesRelationships == 'undefined';
	ancestriesRestored	= false;

	read_key				(key: string): any | null { return this.parse(localStorage[key]); }
	write_key<T>			(key: string, value: T) { localStorage[key] = JSON.stringify(value); }
	writeDB_key<T>			(key: string, value: T) { this.write_key(this.dbKey_for(key), value); }
	readDB_key				(key: string): any | null { return this.read_key(this.dbKey_for(key)); }
	dbKey_for				(key: string): string { return this.keyPair_for(dbDispatch.db.dbType, key); }
	delete_paging_state_for (key: string) { this.write_keyPair(this.dbKey_for(IDPersistant.page_states), key, null); }
	keyPair_for				(key: string, sub_key: string): string { return `${key}${k.generic_separator}${sub_key}`; }

	parse(key: string | null): any | null {
		if (!key || key == 'undefined') {
			return null;
		}		
		return JSON.parse(key);
	}

	queryStrings_apply() {
		const queryStrings = k.queryStrings;
		const shownNames = queryStrings.get('show')?.split(k.comma) ?? [];
		const hiddenNames = queryStrings.get('hide')?.split(k.comma) ?? [];
        const eraseOptions = queryStrings.get('erase')?.split(k.comma) ?? [];
		const shown = Object.fromEntries(shownNames.map(s => [s, true]) ?? {});
		const hidden = Object.fromEntries(hiddenNames.map(s => [s, false]) ?? {});
		const keyedFlags: { [key: string]: boolean } = {...shown, ...hidden};
		this.applyFor_key_name(IDPersistant.layout, 'clusters', (flag) => s_cluster_mode.set(flag));
		for (const [name, flag] of Object.entries(keyedFlags)) {
			switch (name) {
				case 'details':
					s_show_details.set(flag);
					break;
				case 'controls':
					k.show_controls = flag;
					this.write_key(IDPersistant.controls, flag);
					break;
				case 'tinyDots':
					k.show_tinyDots = flag;
					this.write_key(IDPersistant.tinyDots, flag);
					break;
				case 'arrowheads':
					k.show_arrowheads = flag;
					this.write_key(IDPersistant.arrowheads, flag);
					break;
				case 'titleAtTop':
					k.show_titleAtTop = flag;
					this.write_key(IDPersistant.title_atTop, flag);
					break;
			}
		}
		for (const option of eraseOptions) {
			switch (option) {
				case 'data':
					dbDispatch.eraseDB = true;
					break;
				case 'settings': 
					localStorage.clear();
					s_ancestries_expanded.set([]);
					s_ancestry_focus.set(h.rootAncestry);
					s_ancestries_grabbed.set([h.rootAncestry]);
					break;
			}
		}
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
		const queryStrings = k.queryStrings;
        const value = queryStrings.get(key);
		if (value) {
			const flag = (value === matching);
			apply(flag);
			if (persist) {
				this.write_key(key, flag);
			}
		}
	}

	ancestries_forKey(key: string): Array<Ancestry> {		// 2 keys supported so far: grabbed, expanded
		const ids = this.read_key(key);
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
		s_shown_relations.subscribe((relations: string) => {
			this.write_key(IDPersistant.relations, relations);
		});
		s_rotation_ring_radius.subscribe((radius: number) => {
			this.write_key(IDPersistant.cluster_arc, radius);
		});
		s_cluster_mode.subscribe((flag: boolean) => {
			this.write_key(IDPersistant.layout, flag);
		});
		s_rotation_ring_angle.subscribe((angle: number) => {
			this.write_key(IDPersistant.ring_angle, angle);
		});
		s_show_details.subscribe((flag: boolean) => {
			this.write_key(IDPersistant.details, flag);
			g.graphRect_update();
			signals.signal_relayoutWidgets_fromFocus();
		});
		s_paging_state.subscribe((paging_state: Paging_State) => {
			if (!!paging_state) {
				const dbKey = this.dbKey_for(IDPersistant.page_states);
				this.write_keyPair(dbKey, paging_state.sub_key, paging_state.description);
			}
		})
	}

	restore_graphOffset() {
		let offset = Point.zero;
		const stored = this.read_key(IDPersistant.origin);
		if (!!stored) {
			offset = new Point(stored.x, stored.y);
		}
		s_user_graphOffset.set(offset);
	}

	restore_grabbed_andExpanded(force: boolean = false) {
		if (!this.ancestriesRestored || force) {
			this.ancestriesRestored = true;
			s_ancestries_grabbed.set(this.ancestries_forKey(this.dbKey_for(IDPersistant.grabbed)));
			s_ancestries_expanded.set(this.ancestries_forKey(this.dbKey_for(IDPersistant.expanded)));
			s_ancestries_grabbed.subscribe((ancestries: Array<Ancestry>) => {
				this.writeDB_key(IDPersistant.grabbed, !ancestries ? null : ancestries.map(a => a.id));		// ancestral paths
			});
			s_ancestries_expanded.subscribe((ancestries: Array<Ancestry>) => {
				this.writeDB_key(IDPersistant.expanded, !ancestries ? null : ancestries.map(a => a.id));	// ancestral paths
			});
		}
	}

	restore_page_states() {
		const descriptions = this.read_sub_keys_forKey(this.dbKey_for(IDPersistant.page_states)) ?? k.empty;
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

	restore_focus() {
		h.rootAncestry_setup();
		let ancestryToFocus = h.rootAncestry;
		if (!this.ignoreAncestries) {
			const focusid = this.readDB_key(IDPersistant.focus);
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
		s_ancestry_focus.subscribe((ancestry: Ancestry) => {
			this.writeDB_key(IDPersistant.focus, !ancestry ? null : ancestry.id);
		});
	}

	restore_constants() {
		// localStorage.clear();
		// const isLocal = g.isServerLocal;
		// this.write_key(IDPersistant.row_height, 20);
		// this.write_key(IDPersistant.dot_size, 13);

		if (this.ignoreAncestries) {
			this.write_key(IDPersistant.relationships, true);
		}
		this.write_key(IDPersistant.title_atTop, false);
		k.show_controls = this.read_key(IDPersistant.controls) ?? true;
		k.show_tinyDots = this.read_key(IDPersistant.tinyDots) ?? true;
		k.show_arrowheads = this.read_key(IDPersistant.arrowheads) ?? false;
		k.show_titleAtTop = this.read_key(IDPersistant.title_atTop) ?? false;
		g.applyScale(!g.device_isMobile ? 1 : this.read_key(IDPersistant.scale) ?? 1);
		s_rotation_ring_angle.set(this.read_key(IDPersistant.ring_angle) ?? 0);
		s_show_details.set(this.read_key(IDPersistant.details) ?? false);
		s_thing_fontFamily.set(this.read_key(IDPersistant.font) ?? 'Arial');
		s_cluster_mode.set(this.read_key(IDPersistant.layout) ?? false);
		s_rotation_ring_radius.set(this.read_key(IDPersistant.cluster_arc) ?? 130);
		s_shown_relations.set(this.read_key(IDPersistant.relations) ?? GraphRelations.children);
		this.restore_graphOffset();
		this.reactivity_subscribe()
	}

	graphOffset_setTo(origin: Point): boolean {
		if (get(s_user_graphOffset) != origin) {
			persistLocal.write_key(IDPersistant.origin, origin);
			s_user_graphOffset.set(origin);
			return true;
		}
		return false;
	}

}

export const persistLocal = new Persist_Local();
