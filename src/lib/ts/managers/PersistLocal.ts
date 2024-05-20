import { g, k, u, Point, signals, Ancestry, dbDispatch, GraphRelations } from '../common/GlobalImports'
import { s_ancestry_focus, s_show_details, s_user_graphOffset } from '../state/State';
import { s_thing_fontFamily, s_graph_relations } from '../state/State';
import { s_ring_angle, s_layout_asClusters } from '../state/State';
import { s_ancestries_grabbed, s_ancestries_expanded } from '../state/State';
import { h } from '../db/DBDispatch';

export enum IDPersistant {
	relationships = 'relationships',
	show_children = 'show_children',
	title_atTop   = 'title_atTop',
	arrowheads	  = 'arrowheads',
	relations	  = 'relations',
	expanded	  = 'expanded',
	controls	  = 'controls',
	grabbed		  = 'grabbed',
	details		  = 'details',
	cluster		  = 'cluster',
	layout		  = 'layout',
	origin		  = 'origin',
	scale		  = 'scale',
	focus		  = 'focus',
	angle		  = 'angle',
	font		  = 'font',
	db			  = 'db',
}

class PersistLocal {
	// for backwards compatibility with {focus, grabbed, expanded} which were stored as relationship ids (not as ancestry strings)
	usesRelationships = localStorage[IDPersistant.relationships];
	ignoreAncestries = !this.usesRelationships || this.usesRelationships == 'undefined';
	ancestriesRestored = false;

	queryStrings_apply() {
		const queryStrings = k.queryString;
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

	key_ancestries(key: string): Array<Ancestry> {
		const ancestryStrings = this.key_read(key);
		const length = ancestryStrings?.length ?? 0;
		if (this.ignoreAncestries || !ancestryStrings || length == 0) {
			return [];
		}
		let needsRewrite = false;
		const ancestries: Array<Ancestry> = [];
		const reversed = ancestryStrings.reverse();
		reversed.forEach((ancestryString: string, index: number) => {
			const id = Ancestry.idPredicate_for(ancestryString);
			const ancestry = h.ancestry_remember_createUnique(ancestryString, id);
			if (!ancestry) {
				ancestryStrings.slice(1, length - index);
				needsRewrite = true;
			} else {
				for (const id of ancestry.ids) {
					const relationship = h.relationship_forHID(id.hash());
					if (!relationship) {
						ancestryStrings.slice(1, length - index);
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
			this.key_write(key, ancestryStrings);
		}
		return ancestries;
	}

	restore() {
		// localStorage.clear();
		// const isLocal = u.isServerLocal;
		// this.key_write(IDPersistant.row_height, 20);
		// this.key_write(IDPersistant.dot_size, 13);

		if (this.ignoreAncestries) {
			this.key_write(IDPersistant.relationships, true);
		}
		this.key_write(IDPersistant.title_atTop, false);
		k.show_controls = this.key_read(IDPersistant.controls) ?? true;
		k.show_arrowheads = this.key_read(IDPersistant.arrowheads) ?? false;
		k.show_titleAtTop = this.key_read(IDPersistant.title_atTop) ?? false;
		g.applyScale(!u.device_isMobile ? 1 : this.key_read(IDPersistant.scale) ?? 1);

		s_ring_angle.set(this.key_read(IDPersistant.angle) ?? 0);
		s_show_details.set(this.key_read(IDPersistant.details) ?? false);
		s_thing_fontFamily.set(this.key_read(IDPersistant.font) ?? 'Arial');
		s_layout_asClusters.set(this.key_read(IDPersistant.layout) ?? false);
		s_user_graphOffset.set(this.key_read(IDPersistant.origin) ?? new Point());
		s_graph_relations.set(this.key_read(IDPersistant.relations) ?? GraphRelations.children);

		s_ring_angle.subscribe((angle: number) => {
			this.key_write(IDPersistant.angle, angle);
		})
		s_graph_relations.subscribe((relations: string) => {
			this.key_write(IDPersistant.relations, relations);
		})
		s_layout_asClusters.subscribe((flag: boolean) => {
			this.key_write(IDPersistant.layout, flag);
		})
		s_show_details.subscribe((flag: boolean) => {
			this.key_write(IDPersistant.details, flag);
			g.graphRect_update();
			signals.signal_relayoutWidgets_fromFocus();
		});
	}

	ancestries_restore(force: boolean = false) {
		if (!this.ancestriesRestored || force) {
			this.ancestriesRestored = true;
			this.focus_restore();
			s_ancestries_grabbed.set(this.dbKey_ancestries(IDPersistant.grabbed));
			s_ancestries_expanded.set(this.dbKey_ancestries(IDPersistant.expanded));
	
			s_ancestries_grabbed.subscribe((ancestries: Array<Ancestry>) => {
				this.dbKey_write(IDPersistant.grabbed, !ancestries ? null : ancestries.map(p => p.ancestryString));
			});
	
			s_ancestries_expanded.subscribe((ancestries: Array<Ancestry>) => {
				this.dbKey_write(IDPersistant.expanded, !ancestries ? null : ancestries.map(p => p.ancestryString));
			});
		}
	}

	focus_restore() {
		h.rootAncestry_setup();
		let ancestryToFocus = h.rootAncestry;
		if (!this.ignoreAncestries) {
			const focusAncestryString = this.dbKey_read(IDPersistant.focus);
			if (focusAncestryString) {
				const focusAncestry = h.ancestry_remember_createUnique(focusAncestryString);
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
			this.dbKey_write(IDPersistant.focus, !ancestry ? null : ancestry.ancestryString);
		});
	}

	key_apply(key: string, matching: string, apply: (flag: boolean) => void, persist: boolean = true) {
		const queryStrings = k.queryString;
        const value = queryStrings.get(key);
		if (value) {
			const flag = (value === matching);
			apply(flag);
			if (persist) {
				this.key_write(key, flag);
			}
		}
	}

}

export const persistLocal = new PersistLocal();
