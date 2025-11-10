import { T_Startup, T_Dragging, T_Auto_Adjust } from '../common/Enumerations';
import { Hierarchy } from '../managers/Hierarchy';
import Ancestry from '../runtime/Ancestry';
import S_Alteration from './S_Alteration';
import S_Title_Edit from './S_Title_Edit';
import { writable } from 'svelte/store';
import S_Element from './S_Element';

export class State {
	w_count_rebuild = writable<number>(0);
	w_count_window_resized = writable<number>(0);
}

export const state = new State();

const _____THING: unique symbol = Symbol('THING');

export const w_relationship_order	= writable<number>();
export const w_thing_fontFamily		= writable<string>();
export const w_thing_title			= writable<string | null>();
export const w_s_alteration			= writable<S_Alteration | null>();
export const w_s_title_edit			= writable<S_Title_Edit | null>(null);

const _____ANCESTRY: unique symbol = Symbol('ANCESTRY');

export const w_hierarchy			= writable<Hierarchy>();
export const w_ancestry_focus		= writable<Ancestry>();
export const w_ancestry_forDetails	= writable<Ancestry>();

const _____COUNTS: unique symbol = Symbol('COUNTS');

export const w_count_mouse_up		= writable<number>(0);
export const w_count_details		= writable<number>(0);	

const _____OTHER: unique symbol = Symbol('OTHER');

export const w_t_startup			= writable<T_Startup>(T_Startup.start);
export const w_auto_adjust_graph	= writable<T_Auto_Adjust | null>();
export const w_s_hover				= writable<S_Element | null>();
export const w_popupView_id			= writable<string | null>();
export const w_dragging_active		= writable<T_Dragging>();
export const w_control_key_down		= writable<boolean>(false);
export const w_device_isMobile		= writable<boolean>();
export const w_font_size			= writable<number>();
