import { T_Startup, T_Dragging, T_Auto_Adjust } from '../common/Enumerations';
import { Hierarchy } from './Hierarchy';
import Ancestry from '../runtime/Ancestry';
import S_Alteration from '../state/S_Alteration';
import S_Title_Edit from '../state/S_Title_Edit';
import S_Detectable from '../state/S_Detectable';
import { writable } from 'svelte/store';
import { c } from './Configuration';

export class Stores {

	static readonly _____THING: unique symbol = Symbol('THING');

	w_thing_fontFamily	   = writable<string>();
	w_thing_title		   = writable<string | null>();
	w_relationship_order   = writable<number>(0);
	w_s_alteration		   = writable<S_Alteration | null>();
	w_s_title_edit		   = writable<S_Title_Edit | null>(null);

	static readonly _____ANCESTRY: unique symbol = Symbol('ANCESTRY');

	w_hierarchy			   = writable<Hierarchy>();
	w_ancestry_focus	   = writable<Ancestry>();
	w_ancestry_forDetails  = writable<Ancestry>();

	static readonly _____COUNTS: unique symbol = Symbol('COUNTS');

	w_count_mouse_up	   = writable<number>(0);
	w_count_rebuild		   = writable<number>(0);
	w_count_window_resized = writable<number>(0);
	w_count_details		   = writable<number>(0);

	static readonly _____OTHER: unique symbol = Symbol('OTHER');

	w_t_startup			   = writable<T_Startup>(T_Startup.start);
	w_auto_adjust_graph	   = writable<T_Auto_Adjust | null>();
	w_s_hover			   = writable<S_Detectable | null>();
	w_dragging_active	   = writable<T_Dragging>();
	w_popupView_id		   = writable<string | null>();
	w_control_key_down	   = writable<boolean>(false);
	w_font_size			   = writable<number>();
}

export const s = new Stores();
