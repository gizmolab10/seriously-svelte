import { T_Startup, T_Auto_Adjust } from '../common/Enumerations';
import { Hierarchy } from '../managers/Hierarchy';
import Ancestry from '../runtime/Ancestry';
import { writable } from 'svelte/store';

export class Stores {

	static readonly _____THING: unique symbol = Symbol('THING');

	w_relationship_order  = writable<number>(0);
	w_thing_fontFamily	  = writable<string>();
	w_thing_title		  = writable<string | null>();

	static readonly _____ANCESTRY: unique symbol = Symbol('ANCESTRY');

	w_hierarchy			  = writable<Hierarchy>();
	w_ancestry_focus	  = writable<Ancestry>();
	w_ancestry_forDetails = writable<Ancestry>();

	static readonly _____OTHER: unique symbol = Symbol('OTHER');

	w_t_startup			  = writable<T_Startup>(T_Startup.start);
	w_t_auto_adjust		  = writable<T_Auto_Adjust | null>();
	w_font_size			  = writable<number>();
}

export const s  = new Stores();
