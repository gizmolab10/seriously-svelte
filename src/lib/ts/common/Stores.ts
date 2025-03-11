import { Rect, Point, Ancestry, Hierarchy, G_Cluster } from '../common/Global_Imports';
import { T_GraphMode, T_Hierarchy, T_Details, T_Startup } from '../common/Global_Imports';
import { S_Paging, S_Title_Edit, S_Alteration } from '../common/Global_Imports';
import { get, writable } from 'svelte/store';

export const w_ancestry_showing_tools = writable<Ancestry | null>();
export const w_ancestries_expanded	  = writable<Array<Ancestry>>();
export const w_ancestries_grabbed	  = writable<Array<Ancestry>>();
export const w_ancestry_focus		  = writable<Ancestry>();
export const w_hierarchy			  = writable<Hierarchy>();

export const w_s_title_edit			  = writable<S_Title_Edit | null>();
export const w_s_alteration			  = writable<S_Alteration | null>();
export const w_s_paging				  = writable<S_Paging>();

export const w_t_countDots			  = writable<Array<T_Hierarchy>>();
export const w_t_details			  = writable<Array<T_Details>>();

export const w_t_graphMode			  = writable<T_GraphMode>();
export const w_t_treeMode			  = writable<T_Hierarchy>();
export const w_t_startup			  = writable<T_Startup>();
export const w_t_database			  = writable<string>();4

export const w_g_active_cluster		  = writable<G_Cluster | null>();

export const w_mouse_location_scaled  = writable<Point>();
export const w_user_graph_center	  = writable<Point>();
export const w_user_graph_offset	  = writable<Point>();
export const w_mouse_location		  = writable<Point>();
export const w_graph_rect			  = writable<Rect>();

export const w_id_popupView			  = writable<string | null>();
export const w_info_title			  = writable<string | null>();
export const w_thing_color			  = writable<string | null>();
export const w_thing_fontFamily		  = writable<string>();
export const w_storage_update_trigger = writable<number>();
export const w_ring_rotation_radius	  = writable<number>();
export const w_ring_rotation_angle	  = writable<number>();
export const w_count_mouse_up		  = writable<number>();
export const w_count_rebuild		  = writable<number>();
export const w_count_resize			  = writable<number>();
export const w_font_size			  = writable<number>();
export const w_show_details			  = writable<boolean>();
export const w_device_isMobile		  = writable<boolean>();

class Stores {

	reset_settings() {
		const rootAncestry = get(w_hierarchy).rootAncestry;
		w_ancestries_grabbed.set([rootAncestry]);
		w_ancestry_focus.set(rootAncestry);
		w_ancestries_expanded.set([]);
	}
	
	setup_defaults() {
		w_t_startup.set(T_Startup.start);
		w_thing_color.set(null);
		w_count_mouse_up.set(0);
		w_count_rebuild.set(0);
		w_count_resize.set(0);
	}

}

export const stores = new Stores();
