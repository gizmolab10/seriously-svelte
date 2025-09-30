import { G_Paging, T_Graph, T_Detail, T_Kinship, T_Preference, T_Auto_Adjust, T_Startup } from '../common/Global_Imports';
import { c, h, k, u, show, grabs, debug, radial, colors, Ancestry, databases } from '../common/Global_Imports';
import { w_ancestry_focus, w_ancestries_grabbed, w_ancestries_expanded, w_t_startup } from './Stores';
import { w_auto_adjust_graph, w_show_tree_ofType, w_show_graph_ofType } from './Stores';
import { w_t_database, w_ring_rotation_angle, w_ring_rotation_radius } from './Stores';
import { w_g_paging, w_font_size, w_thing_fontFamily, w_depth_limit } from './Stores';
import { w_show_details_ofType, w_show_countDots_ofType } from './Stores';
import { w_background_color, w_separator_color } from './Stores';
import { get } from 'svelte/store';

export class Preferences {
	branches_areChildren = true;
	show_other_databases = false;
	get focus_key(): string { return this.branches_areChildren ? T_Preference.focus_forChildren : T_Preference.focus_forParents; }
	get expanded_key(): string { return this.branches_areChildren ? T_Preference.expanded_children : T_Preference.expanded_parents; }

	static readonly _____READ_WRITE: unique symbol;

	dump() 									 { console.log(localStorage); }
	read_key	   (key: string): any | null { return this.parse(localStorage[key]); }
	readDB_key	   (key: string): any | null { const dbKey = this.db_keyFor(key); return !dbKey ? null : this.read_key(dbKey); }
	writeDB_key<T> (key: string, value: T)	 { const dbKey = this.db_keyFor(key); if (!!dbKey) { this.write_key(dbKey, value); } }

	write_key<T> (key: string, value: T) {
		const object = u.stringify_object(value as object);
		if (!!object) {
			if (object.length > 3000000) {
				console.warn(`too large for localStorage: ${key} ${object.length} bytes`);
			} else {
				localStorage[key] = object;
			}
		}
	}

	writeDB_keyPairs_forKey<T>(key: string, sub_key: string, value: T): void {	// pair => key, sub_key
		const dbKey = this.db_keyFor(key);
		if (!!dbKey) {
			const sub_keys: string[] = this.read_key(dbKey) ?? [];
			const pair = this.keyPair_for(dbKey, sub_key);
			this.write_key(pair, value);			// first store the value by key pair
			if (sub_keys.length == 0 || !sub_keys.includes(sub_key)) {
				sub_keys.push(sub_key);
				this.write_key(dbKey, sub_keys);								// then store they sub key by key
			}
		}
	}

	readDB_keyPairs_forKey(key: string): Array<any> {
		let values: Array<any> = [];
		const dbKey = this.db_keyFor(key);
		if (!!dbKey) {
			const sub_keys: string[] = this.read_key(dbKey) ?? [];
			for (const sub_key of sub_keys) {
				const value = this.read_key(this.keyPair_for(dbKey, sub_key));
				if (!!value) {												// ignore undefined or null
					values.push(value);
				}
			}
		}
		return values;
	}
	
	static readonly _____RESTORE: unique symbol;

	restore_grabbed() {
		function ids_forDB(array: Array<Ancestry>): string { return u.ids_forDB(array).join(', '); }
		if (c.eraseDB > 0) {
			c.eraseDB -= 1;
			const grabbed = !!h.rootAncestry ? [h.rootAncestry] : [];
			w_ancestries_grabbed.set(grabbed);
		} else {
			w_ancestries_grabbed.set(this.ancestries_readDB_key(T_Preference.grabbed));
			debug.log_grab(`  READ (${get(w_t_database)}): "${ids_forDB(get(w_ancestries_grabbed))}"`);
		}
		setTimeout(() => {
			w_ancestries_grabbed.subscribe((array: Array<Ancestry>) => {
				if (array.length > 0) {
					this.ancestries_writeDB_key(array, T_Preference.grabbed);
					debug.log_grab(`  WRITING (${get(w_t_database)}): "${ids_forDB(array)}"`);
				}
			});
		}, 100);
	}
		
	restore_expanded() {
		if (c.eraseDB > 0) {
			c.eraseDB -= 1;
			w_ancestries_expanded.set([]);
		} else {
			const expanded = p.ancestries_readDB_key(this.expanded_key) ?? p.ancestries_readDB_key('expanded');	// backwards compatible with 'expanded' key
			debug.log_expand(`  READ (${get(w_t_database)}): "${u.ids_forDB(expanded)}"`);
			w_ancestries_expanded.set(expanded);
		}
		setTimeout(() => {
			w_ancestries_expanded.subscribe((array: Array<Ancestry> | null) => {
				if (!!array && array.length > 0) {
					debug.log_expand(`  WRITING (${get(w_t_database)}): "${u.ids_forDB(array)}"`);
					p.ancestries_writeDB_key(array, this.expanded_key);
				}
			});
		}, 100);
	}

	restore_focus() {
		let ancestryToFocus = h?.rootAncestry ?? null;
		if (c.eraseDB > 0) {
			c.eraseDB -= 1;
			if (!!ancestryToFocus) {
				w_ancestry_focus.set(ancestryToFocus);
			}
		} else {
			const focusPath = p.readDB_key(this.focus_key) ?? p.readDB_key('focus');
			if (!!focusPath) {
				const focusAncestry = h?.ancestry_remember_createUnique(focusPath) ?? null;
				if (!!focusAncestry) {
					ancestryToFocus = focusAncestry;
				}
			}
		}
		if (!!ancestryToFocus) {
			if (!ancestryToFocus.thing) {
				const lastGrabbedAncestry = grabs.ancestry?.parentAncestry;
				if (lastGrabbedAncestry) {
					ancestryToFocus = lastGrabbedAncestry;
				}
			}
			ancestryToFocus.becomeFocus(true);
		}
		w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			p.writeDB_key(this.focus_key, !ancestry ? null : ancestry.pathString);
		});
	}
	
	static readonly _____ANCESTRIES: unique symbol;

	ancestries_writeDB_key(ancestries: Array<Ancestry>, key: string) {	// 2 keys use this {grabbed, expanded}
		const pathStrings = ancestries.map(a => a.pathString);			// array of pathStrings (of Relationship ids)
		this.writeDB_key(key, ancestries.length == 0 ? null : pathStrings);
	}

	ancestries_readDB_key(key: string): Array<Ancestry> {				// 2 keys use this {grabbed, expanded}
		const pathStrings = this.readDB_key(key);
		const length = pathStrings?.length ?? 0;
		let ancestries: Array<Ancestry> = [];
		if (length > 0) {
			for (const pathString of pathStrings) {
				const ancestry = h?.ancestry_isAssured_valid_forPath(pathString);
				if (!!ancestry) {
					ancestries.push(ancestry);
				}
			};
		}
		debug.log_preferences(`  ${key.toUpperCase()} ${ancestries.map(a => a.id)}`);
		return ancestries;
	}
	
	static readonly _____PRIMITIVES: unique symbol;

	db_keyFor	(key: string):			 string | null { const type = databases.db_now?.t_database; return !type ? null : this.keyPair_for(type, key); }
	keyPair_for	(key: string, sub_key: string):	string { return `${key}${k.separator.generic}${sub_key}`; }

	parse(key: string | null | undefined): any | null {
		if (!key || key == 'undefined') {
			return null;
		}		
		return JSON.parse(key);
	}

	preferences_reset() {
		const ids = Object.keys(T_Preference)
			.filter(key => isNaN(Number(key))) // Exclude numeric keys
			.map(key => T_Preference[key as keyof typeof T_Preference]);
		for (const id of ids) {
			if (id != 'local') {
				this.write_key(id, null);
			}
		}
	}
	
	static readonly _____SUBSCRIBE_AND_RESTORE: unique symbol;

	restore_paging() { radial.createAll_thing_pages_fromDict(this.readDB_key(T_Preference.paging)); }

	reactivity_subscribe() {

		// VISIBILITY

		w_show_tree_ofType.subscribe((value) => {
			this.write_key(T_Preference.tree, value);
		});
		w_show_countDots_ofType.subscribe((value) => {
			this.write_key(T_Preference.countDots, value);
		});
		w_show_details_ofType.subscribe((value) => {
			this.write_key(T_Preference.detail_types, value);
		});

		// RADIAL

		w_ring_rotation_angle.subscribe((angle: number) => {
			this.write_key(T_Preference.ring_angle, angle);
		});
		w_ring_rotation_radius.subscribe((radius: number) => {
			this.write_key(T_Preference.ring_radius, radius);
		});
		w_t_startup.subscribe((startup) => {
			if (startup == T_Startup.ready) {
				w_g_paging.subscribe((g_paging: G_Paging) => {
					this.writeDB_key(T_Preference.paging, radial.s_thing_pages_byThingID);
				})
			}
		});
		
		// OTHER

		w_depth_limit.subscribe((depth: number) => {
			this.write_key(T_Preference.levels, depth);
		});
		w_auto_adjust_graph.subscribe((auto_adjust: T_Auto_Adjust | null) => {
			this.write_key(T_Preference.auto_adjust, auto_adjust);
		});
		w_separator_color.subscribe((color: string) => {
			this.write_key(T_Preference.separator, color);
			w_background_color.set(colors.ofBackgroundFor(color));
		})
		w_background_color.subscribe((color: string) => {
			document.documentElement.style.setProperty('--css-background-color', color);
			this.write_key(T_Preference.background, color);
			colors.banner = colors.ofBannerFor(color);
			// colors.background = color;	// uncommenting this turns the glow buttons gray
		})

		show.reactivity_subscribe();
	}

	restore_defaults() {
		this.restore_stores();
		this.reactivity_subscribe()
		this.show_other_databases = this.read_key(T_Preference.other_databases) ?? false;
	}

	restore_stores() {

		// VISIBILITY
		w_show_tree_ofType		.set( this.read_key(T_Preference.tree)					?? T_Kinship.children);
		w_show_graph_ofType		.set( this.read_key(T_Preference.graph)					?? T_Graph.tree);
		w_show_countDots_ofType	.set( this.read_key(T_Preference.countDots)				?? [T_Kinship.children]);
		w_show_details_ofType	.set( this.read_key(T_Preference.detail_types)			?? [T_Detail.actions, T_Detail.data]);

		// RADIAL
		w_ring_rotation_angle	.set( this.read_key(T_Preference.ring_angle)			?? 0);
		w_ring_rotation_radius	.set( Math.max( this.read_key(T_Preference.ring_radius) ?? 0, k.radius.ring_minimum));
	
		// OTHER
		w_depth_limit			.set( this.read_key(T_Preference.levels)				?? 2);
		w_font_size				.set( this.read_key(T_Preference.font_size)				?? 14);
		w_auto_adjust_graph		.set( this.read_key(T_Preference.auto_adjust)			?? null);
		w_thing_fontFamily		.set( this.read_key(T_Preference.font)					?? 'Times New Roman');
		w_background_color		.set( this.read_key(T_Preference.background)			?? colors.background);
		w_separator_color		.set( this.read_key(T_Preference.separator)				?? colors.separator);
	}

}

export const p = new Preferences();
