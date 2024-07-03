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
	tinyDots	  = 'tinyDots',
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
		this.applyFor_key_name(IDPersistant.layout, 'clusters', (flag) => s_layout_asClusters.set(flag));
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

	get dbType(): string { return dbDispatch.db.dbType; }
	readDB_key(key: string): any | null { return this.read_key(key + this.dbType); }
	write_key(key: string, value: any) { localStorage[key] = JSON.stringify(value); }
	writeDB_key(key: string, value: any) { this.write_key(key + this.dbType, value); }
	readDB_ancestries_forKey(key: string): Array<Ancestry> { return this.ancestries_forKey(key + this.dbType); }
	restore_pageStates() { s_page_states.set(Page_States.create_fromDescription(this.read_key(IDPersistant.indices) ?? k.empty)); }

	read_key(key: string): any | null {
		const storedValue = localStorage[key];
		if (!storedValue || storedValue == 'undefined') {
			return null;
		} else {
			return JSON.parse(storedValue);
		} 
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

	ancestries_forKey(key: string): Array<Ancestry> {
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
		s_graph_relations.subscribe((relations: string) => {
			this.write_key(IDPersistant.relations, relations);
		});
		s_cluster_arc_radius.subscribe((radius: number) => {
			this.write_key(IDPersistant.cluster_arc, radius);
		});
		s_layout_asClusters.subscribe((flag: boolean) => {
			this.write_key(IDPersistant.layout, flag);
		});
		s_ring_angle.subscribe((angle: number) => {
			this.write_key(IDPersistant.angle, angle);
		});
		s_page_states.subscribe((page_states: Page_States) => {
			if (!!page_states) {
				this.write_key(IDPersistant.indices, page_states.description);
			}
		});
		s_show_details.subscribe((flag: boolean) => {
			this.write_key(IDPersistant.details, flag);
			g.graphRect_update();
			signals.signal_relayoutWidgets_fromFocus();
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
		s_ring_angle.set(this.read_key(IDPersistant.angle) ?? 0);
		s_show_details.set(this.read_key(IDPersistant.details) ?? false);
		s_thing_fontFamily.set(this.read_key(IDPersistant.font) ?? 'Arial');
		s_layout_asClusters.set(this.read_key(IDPersistant.layout) ?? false);
		s_cluster_arc_radius.set(this.read_key(IDPersistant.cluster_arc) ?? 130);
		s_graph_relations.set(this.read_key(IDPersistant.relations) ?? GraphRelations.children);
		this.restore_graphOffset();
		this.reactivity_subscribe()
	}

	restore_ancestries(force: boolean = false) {
		if (!this.ancestriesRestored || force) {
			this.ancestriesRestored = true;
			s_ancestries_grabbed.set(this.readDB_ancestries_forKey(IDPersistant.grabbed));
			s_ancestries_expanded.set(this.readDB_ancestries_forKey(IDPersistant.expanded));
	
			s_ancestries_grabbed.subscribe((ancestries: Array<Ancestry>) => {
				this.writeDB_key(IDPersistant.grabbed, !ancestries ? null : ancestries.map(p => p.id));
			});
	
			s_ancestries_expanded.subscribe((ancestries: Array<Ancestry>) => {
				this.writeDB_key(IDPersistant.expanded, !ancestries ? null : ancestries.map(p => p.id));
			});
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

	restore_graphOffset() {
		let offset = Point.zero;
		const stored = this.read_key(IDPersistant.origin);
		if (!!stored) {
			offset = new Point(stored.x, stored.y);
		}
		s_user_graphOffset.set(offset);
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
