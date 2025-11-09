import { S_Element, S_Title_Edit, S_Alteration } from '../common/Global_Imports';
import { T_Auto_Adjust, T_Startup, T_Dragging } from '../common/Global_Imports';
import { colors, Ancestry, Hierarchy } from '../common/Global_Imports';
import { G_Paging, G_Cluster } from '../common/Global_Imports';
import { writable } from 'svelte/store';

const _____THING: unique symbol = Symbol('THING');

export const w_relationship_order		= writable<number>();
export const w_thing_fontFamily			= writable<string>();
export const w_thing_title				= writable<string | null>();
export const w_s_alteration				= writable<S_Alteration | null>();
export const w_s_title_edit				= writable<S_Title_Edit | null>(null);

const _____ANCESTRY: unique symbol = Symbol('ANCESTRY');

export const w_hierarchy				= writable<Hierarchy>();
export const w_ancestry_focus			= writable<Ancestry>();
export const w_ancestry_forDetails		= writable<Ancestry>();

const _____RADIAL: unique symbol = Symbol('RADIAL');

export const w_ring_rotation_radius		= writable<number>();
export const w_ring_rotation_angle		= writable<number>();
export const w_g_paging					= writable<G_Paging>();
export const w_g_paging_cluster			= writable<G_Cluster | null>();

const _____COUNTS: unique symbol = Symbol('COUNTS');

export const w_count_window_resized		= writable<number>(0);
export const w_count_mouse_up			= writable<number>(0);
export const w_count_rebuild			= writable<number>(0);
export const w_count_details			= writable<number>(0);	

const _____OTHER: unique symbol = Symbol('OTHER');

export const w_t_startup				= writable<T_Startup>();
export const w_auto_adjust_graph		= writable<T_Auto_Adjust | null>();
export const w_s_hover					= writable<S_Element | null>();
export const w_popupView_id				= writable<string | null>();
export const w_dragging_active			= writable<T_Dragging>();
export const w_control_key_down			= writable<boolean>(false);
export const w_device_isMobile			= writable<boolean>();
export const w_font_size				= writable<number>();

class Stores {
	setup_defaults() {
		w_t_startup.set(T_Startup.start);
	}
}

export const stores = new Stores();
