import { w_g_paging, w_font_size, w_background_color, w_thing_fontFamily } from '../common/Stores';
import { G_Paging, E_Graph, E_Details, E_Kinship, E_Preference } from '../common/Global_Imports';
import { c, k, u, ux, show, debug, radial, colors, Ancestry, databases } from '../common/Global_Imports';
import { w_e_tree, w_e_graph, w_hierarchy, w_e_details, w_e_countDots } from '../common/Stores';
import { w_e_database, w_ring_rotation_angle, w_ring_rotation_radius } from '../common/Stores';
import { w_ancestries_grabbed } from '../common/Stores';
import { get } from 'svelte/store';

export class Preferences {
	// for backwards compatibility with {focus, grabbed, expanded} which were stored as relationship ids (not as ancestry string)
	usesRelationships = localStorage[E_Preference.relationships];
	ignoreAncestries  = !this.usesRelationships || this.usesRelationships == 'undefined';
	
	static readonly READ_WRITE: unique symbol;

	dump() 									 { console.log(localStorage); }
	read_key	   (key: string): any | null { return this.parse(localStorage[key]); }
	readDB_key	   (key: string): any | null { return this.read_key(this.db_keyFor(key)); }
	write_key<T>   (key: string, value: T)	 { localStorage[key] = JSON.stringify(value); }
	writeDB_key<T> (key: string, value: T)	 { this.write_key(this.db_keyFor(key), value); }

	writeDB_keyPairs_forKey<T>(key: string, sub_key: string, value: T): void {	// pair => key, sub_key
		const dbKey = this.db_keyFor(key);
		const sub_keys: Array<string> = this.read_key(dbKey) ?? [];
		const pair = this.keyPair_for(dbKey, sub_key);
		this.write_key(pair, value);			// first store the value by key pair
		if (sub_keys.length == 0 || !sub_keys.includes(sub_key)) {
			sub_keys.push(sub_key);
			this.write_key(dbKey, sub_keys);								// then store they sub key by key
		}
	}

	readDB_keyPairs_forKey(key: string): Array<any> {
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
	
	static readonly ANCESTRIES: unique symbol;

	restore_grabbed() {
		function ids_forDB(array: Array<Ancestry>): string { return u.ids_forDB(array).join(', '); }
		if (c.eraseDB > 0) {
			c.eraseDB -= 1;
			w_ancestries_grabbed.set([get(w_hierarchy).rootAncestry]);
		} else {
			w_ancestries_grabbed.set(this.ancestries_readDB_key(E_Preference.grabbed));
			debug.log_grab(`  READ (${get(w_e_database)}): "${ids_forDB(get(w_ancestries_grabbed))}"`);
		}
		setTimeout(() => {
			w_ancestries_grabbed.subscribe((array: Array<Ancestry>) => {
				if (array.length > 0) {
					this.ancestries_writeDB_key(array, E_Preference.grabbed);
					debug.log_grab(`  WRITING (${get(w_e_database)}): "${ids_forDB(array)}"`);
				}
			});
		}, 100);
	}

	ancestries_writeDB_key(ancestries: Array<Ancestry>, key: string) {	// 2 keys use this {grabbed, expanded}
		const pathStrings = ancestries.map(a => a.pathString);			// array of pathStrings (of Relationship ids)
		this.writeDB_key(key, ancestries.length == 0 ? null : pathStrings);
		debug.log_preferences(`! ${key.toUpperCase()} ${ancestries.length} pathStrings "${pathStrings}" titles "${ancestries.map(a => a.title)}"`);
	}

	ancestries_readDB_key(key: string): Array<Ancestry> {				// 2 keys use this {grabbed, expanded}
		const pathStrings = this.readDB_key(key);
		const length = pathStrings?.length ?? 0;
		let ancestries: Array<Ancestry> = [];
		if (!this.ignoreAncestries && length > 0) {
			let h = get(w_hierarchy);
			for (const pathString of pathStrings) {
				const ancestry = h.ancestry_isAssured_valid_forPath(pathString);
				if (!!ancestry) {
					ancestries.push(ancestry);
				}
			};
		}
		debug.log_preferences(`  ${key.toUpperCase()} ${ancestries.map(a => a.id)}`);
		return ancestries;
	}
	
	static readonly PRIMITIVES: unique symbol;

	db_keyFor	(key: string):					string { return this.keyPair_for(databases.db_now.e_database, key); }
	keyPair_for	(key: string, sub_key: string):	string { return `${key}${k.separator.generic}${sub_key}`; }

	parse(key: string | null | undefined): any | null {
		if (!key || key == 'undefined') {
			return null;
		}		
		return JSON.parse(key);
	}

	preferences_reset() {
		const ids = Object.keys(E_Preference)
			.filter(key => isNaN(Number(key))) // Exclude numeric keys
			.map(key => E_Preference[key as keyof typeof E_Preference]);
		for (const id of ids) {
			if (id != 'local') {
				this.write_key(id, null);
			}
		}

	}
	
	static readonly SUBSCRIBE_AND_RESTORE: unique symbol;

	restore_paging() { radial.createAll_thing_pages_fromDict(this.readDB_key(E_Preference.paging)); }

	reactivity_subscribe() {
		w_e_tree.subscribe((value) => {
			this.write_key(E_Preference.tree, value);
		});
		w_e_graph.subscribe((value) => {
			this.write_key(E_Preference.graph, value);
		});
		w_e_countDots.subscribe((value) => {
			this.write_key(E_Preference.countDots, value);
		});
		w_ring_rotation_angle.subscribe((angle: number) => {
			this.write_key(E_Preference.ring_angle, angle);
		});
		w_e_details.subscribe((value) => {
			this.write_key(E_Preference.detail_types, value);
		});
		w_ring_rotation_radius.subscribe((radius: number) => {
			this.write_key(E_Preference.ring_radius, radius);
		});
		w_g_paging.subscribe((g_paging: G_Paging) => {
			this.writeDB_key(E_Preference.paging, radial.s_thing_pages_byThingID);
		})
		w_background_color.subscribe((color: string) => {
			document.documentElement.style.setProperty('--css-background-color', color);
			this.write_key(E_Preference.background, color);
		})
		show.reactivity_subscribe();
	}

	restore_defaults() {
		if (this.ignoreAncestries) {
			this.write_key(E_Preference.relationships, true);
		}
		w_font_size.set(this.read_key(E_Preference.font_size) ?? 14);
		w_ring_rotation_angle.set(this.read_key(E_Preference.ring_angle) ?? 0);
		w_e_graph.set(this.read_key(E_Preference.graph) ?? E_Graph.tree);
		w_e_tree.set(this.read_key(E_Preference.tree) ?? E_Kinship.child);
		w_thing_fontFamily.set(this.read_key(E_Preference.font) ?? 'Times New Roman');
		w_e_details.set(this.read_key(E_Preference.detail_types) ?? [E_Details.storage]);
		w_e_countDots.set(this.read_key(E_Preference.countDots) ?? [E_Kinship.child]);
		w_background_color.set(this.read_key(E_Preference.background) ?? colors.background);
		w_ring_rotation_radius.set(Math.max(this.read_key(E_Preference.ring_radius) ?? 0, k.radius.ring_center));
		this.reactivity_subscribe()
	}

}

export const p = new Preferences();
