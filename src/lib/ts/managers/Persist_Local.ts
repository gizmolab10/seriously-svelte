import { s_ring_angle, s_cluster_arc_radius, s_layout_asClusters } from '../state/Reactive_State';
import { s_ancestry_focus, s_show_details, s_user_graphOffset } from '../state/Reactive_State';
import { g, k, get, Point, signals, Ancestry, dbDispatch } from '../common/Global_Imports';
import { s_ancestries_grabbed, s_ancestries_expanded } from '../state/Reactive_State';
import { Page_State, Page_States, GraphRelations } from '../common/Global_Imports';
import { s_thing_fontFamily, s_graph_relations } from '../state/Reactive_State';
import { s_page_states } from '../state/Reactive_State';
import { h } from '../db/DBDispatch';

export enum IDPersistant {
	relationships = 'relationships',
	show_children = 'show_children',
	title_atTop   = 'title_atTop',
	cluster_arc	  = 'cluster_arc',
	arrowheads	  = 'arrowheads',
	relations	  = 'relations',
	expanded	  = 'expanded',
	controls	  = 'controls',
	grabbed		  = 'grabbed',
	details		  = 'details',
	cluster		  = 'cluster',
	indices		  = 'indices',
	layout		  = 'layout',
	origin		  = 'origin',
	scale		  = 'scale',
	focus		  = 'focus',
	angle		  = 'angle',
	font		  = 'font',
	db			  = 'db',
}

class Persist_Local {
	// for backwards compatibility with {focus, grabbed, expanded} which were stored as relationship ids (not as ancestry strings)
	usesRelationships = localStorage[IDPersistant.relationships];
	ignoreAncestries = !this.usesRelationships || this.usesRelationships == 'undefined';
	ancestriesRestored = false;

	queryStrings_apply() {
		const queryStrings = k.queryStrings;
		const shownNames = queryStrings.get('show')?.split(k.comma) ?? [];
		const hiddenNames = queryStrings.get('hide')?.split(k.comma) ?? [];
        const eraseOptions = queryStrings.get('erase')?.split(k.comma) ?? [];
		const shown = Object.fromEntries(shownNames.map(s => [s, true]) ?? {});
		const hidden = Object.fromEntries(hiddenNames.map(s => [s, false]) ?? {});
		const keyedFlags: { [key: string]: boolean } = {...shown, ...hidden};
		this.key_apply(IDPersistant.layout, 'clusters', (flag) => s_layout_asClusters.set(flag));
		for (const [name, flag] of Object.entries(keyedFlags)) {
			switch (name) {
				case 'details':
					s_show_details.set(flag);
					break;
				case 'controls':
					k.show_controls = flag;
					this.key_write(IDPersistant.controls, flag);
					break;
				case 'arrowheads':
					k.show_arrowheads = flag;
					this.key_write(IDPersistant.arrowheads, flag);
					break;
				case 'titleAtTop':
					k.show_titleAtTop = flag;
					this.key_write(IDPersistant.title_atTop, flag);
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

	get dbType(): string { return dbDispatch.db.dbType; }
	key_write(key: string, value: any) { localStorage[key] = JSON.stringify(value); }
	indices_key_for(kind: string, points_out: boolean) { return `${IDPersistant.indices}-${kind}-${points_out}`; }
	dbKey_ancestries(key: string): Array<Ancestry> { return this.key_ancestries(key + this.dbType); }
	dbKey_write(key: string, value: any) { this.key_write(key + this.dbType, value); }
	dbKey_read(key: string): any | null { return this.key_read(key + this.dbType); }

	key_read(key: string): any | null {
		const storedValue = localStorage[key];
		if (!storedValue || storedValue == 'undefined') {
			return null;
		} else {
			return JSON.parse(storedValue);
		} 
	}

	key_apply(key: string, matching: string, apply: (flag: boolean) => void, persist: boolean = true) {
		const queryStrings = k.queryStrings;
        const value = queryStrings.get(key);
		if (value) {
			const flag = (value === matching);
			apply(flag);
			if (persist) {
				this.key_write(key, flag);
			}
		}
	}

	key_ancestries(key: string): Array<Ancestry> {
		const ids = this.key_read(key);
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
			this.key_write(key, ids);
		}
		return ancestries;
	}

	reactivity_subscribe() {
		s_graph_relations.subscribe((relations: string) => {
			this.key_write(IDPersistant.relations, relations);
		});
		s_cluster_arc_radius.subscribe((radius: number) => {
			this.key_write(IDPersistant.cluster_arc, radius);
		});
		s_layout_asClusters.subscribe((flag: boolean) => {
			this.key_write(IDPersistant.layout, flag);
		});
		s_ring_angle.subscribe((angle: number) => {
			this.key_write(IDPersistant.angle, angle);
		});
		s_page_states.subscribe((page_states: Page_States) => {
			if (!!page_states && !!h) {
				this.indices_persist(page_states, false);
				this.indices_persist(page_states, true);
			}
		});
		s_show_details.subscribe((flag: boolean) => {
			this.key_write(IDPersistant.details, flag);
			g.graphRect_update();
			signals.signal_relayoutWidgets_fromFocus();
		});
	}

	indices_persist(page_states: Page_States, points_out: boolean) {
		const predicates = h.predicates_byDirection(points_out);
		for (const predicate of predicates) {
			const key = this.indices_key_for(predicate.kind, points_out);
			const page_state = page_states.page_state_for(points_out, predicate) ?? Page_State.empty;
			const persisting = `${page_state.index}${k.generic_separator}${page_state.shown}${k.generic_separator}${page_state.total}`;
			this.key_write(key, persisting);
		}
	}

	restore() {
		// localStorage.clear();
		// const isLocal = g.isServerLocal;
		// this.key_write(IDPersistant.row_height, 20);
		// this.key_write(IDPersistant.dot_size, 13);

		if (this.ignoreAncestries) {
			this.key_write(IDPersistant.relationships, true);
		}
		this.key_write(IDPersistant.title_atTop, false);
		k.show_controls = this.key_read(IDPersistant.controls) ?? true;
		k.show_arrowheads = this.key_read(IDPersistant.arrowheads) ?? false;
		k.show_titleAtTop = this.key_read(IDPersistant.title_atTop) ?? false;
		g.applyScale(!g.device_isMobile ? 1 : this.key_read(IDPersistant.scale) ?? 1);
		s_ring_angle.set(this.key_read(IDPersistant.angle) ?? 0);
		s_show_details.set(this.key_read(IDPersistant.details) ?? false);
		s_thing_fontFamily.set(this.key_read(IDPersistant.font) ?? 'Arial');
		s_layout_asClusters.set(this.key_read(IDPersistant.layout) ?? false);
		s_cluster_arc_radius.set(this.key_read(IDPersistant.cluster_arc) ?? 130);
		s_graph_relations.set(this.key_read(IDPersistant.relations) ?? GraphRelations.children);
		this.graphOffset_restore();
		this.reactivity_subscribe()
	}

	ancestries_restore(force: boolean = false) {
		if (!this.ancestriesRestored || force) {
			this.ancestriesRestored = true;
			s_ancestries_grabbed.set(this.dbKey_ancestries(IDPersistant.grabbed));
			s_ancestries_expanded.set(this.dbKey_ancestries(IDPersistant.expanded));
	
			s_ancestries_grabbed.subscribe((ancestries: Array<Ancestry>) => {
				this.dbKey_write(IDPersistant.grabbed, !ancestries ? null : ancestries.map(p => p.id));
			});
	
			s_ancestries_expanded.subscribe((ancestries: Array<Ancestry>) => {
				this.dbKey_write(IDPersistant.expanded, !ancestries ? null : ancestries.map(p => p.id));
			});
		}
	}

	indices_restoreAll() {
		this.indices_restore(false);
		this.indices_restore(true);
	}

	indices_restore(points_out: boolean) {
		const page_states = get(s_page_states) ?? new Page_States();
		const predicates = h.predicates_byDirection(points_out);
		for (const predicate of predicates) {
			const key = this.indices_key_for(predicate.kind, points_out);
			const persisted = this.key_read(key);
			const strings = persisted?.split(k.generic_separator);
			const values = strings?.map(s => Number(s)) ?? [0, 0, 0];
			const page_state = new Page_State(values[0], values[1], values[2]);
			// const page_state = Page_State.empty;
			page_states.set_page_state_for(page_state, points_out, predicate);
		}
		s_page_states.set(page_states);
	}

	focus_restore() {
		h.rootAncestry_setup();
		let ancestryToFocus = h.rootAncestry;
		if (!this.ignoreAncestries) {
			const focusid = this.dbKey_read(IDPersistant.focus);
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
			this.dbKey_write(IDPersistant.focus, !ancestry ? null : ancestry.id);
		});
	}

	graphOffset_restore() {
		let offset = Point.zero;
		const stored = this.key_read(IDPersistant.origin);
		if (!!stored) {
			offset = new Point(stored.x, stored.y);
		}
		s_user_graphOffset.set(offset);
	}

	graphOffset_setTo(origin: Point): boolean {
		if (get(s_user_graphOffset) != origin) {
			persistLocal.key_write(IDPersistant.origin, origin);
			s_user_graphOffset.set(origin);
			return true;
		}
		return false;
	}

}

export const persistLocal = new Persist_Local();
