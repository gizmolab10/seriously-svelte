import { Rect, Point, colors, Ancestry, Hierarchy, G_Cluster } from '../common/Global_Imports';
import { T_Graph, T_Kinship, T_Details, T_Startup } from '../common/Global_Imports';
import { G_Paging, S_Title_Edit, S_Alteration } from '../common/Global_Imports';
import { writable } from 'svelte/store';

export const w_t_countDots			  = writable<Array<T_Kinship>>();
export const w_t_tree				  = writable<Array<T_Kinship>>();
export const w_t_details			  = writable<Array<T_Details>>();
export const w_ancestries_expanded	  = writable<Array<Ancestry>>();
export const w_ancestries_grabbed	  = writable<Array<Ancestry>>();
export const w_visibility_ofNotes	  = writable<Array<string>>();

export const w_s_title_edit			  = writable<S_Title_Edit | null>();
export const w_s_alteration			  = writable<S_Alteration | null>();
export const w_g_paging_cluster		  = writable<G_Cluster | null>();
export const w_thing_title			  = writable<string | null>();
export const w_thing_color			  = writable<string | null>();
export const w_popupView_id			  = writable<string | null>();

export const w_ancestry_focus		  = writable<Ancestry>();
export const w_hierarchy			  = writable<Hierarchy>();
export const w_t_startup			  = writable<T_Startup>();
export const w_g_paging				  = writable<G_Paging>();
export const w_t_graph				  = writable<T_Graph>();
export const w_t_database			  = writable<string>();

export const w_show_related			  = writable<boolean>();
export const w_show_details			  = writable<boolean>();
export const w_device_isMobile		  = writable<boolean>();
export const w_thing_fontFamily		  = writable<string>();
export const w_background_color		  = writable<string>();
export const w_ring_rotation_radius	  = writable<number>();
export const w_count_button_restyle   = writable<number>();
export const w_ring_rotation_angle	  = writable<number>();
export const w_relationship_order	  = writable<number>();
export const w_storage_updated		  = writable<number>();
export const w_count_mouse_up		  = writable<number>();
export const w_count_rebuild		  = writable<number>();
export const w_count_resize			  = writable<number>();
export const w_font_size			  = writable<number>();

export const w_mouse_location_scaled  = writable<Point>();
export const w_user_graph_center	  = writable<Point>();
export const w_user_graph_offset	  = writable<Point>();
export const w_mouse_location		  = writable<Point>();
export const w_graph_rect			  = writable<Rect>();

class Stores {
	setup_defaults() {
		w_count_resize.set(0);
		w_count_rebuild.set(0);
		w_count_mouse_up.set(0);
		w_thing_color.set(null);
		w_t_startup.set(T_Startup.start);
		w_background_color.subscribe((color: string) => {
			colors.separator = colors.separatorFor(color);
		});
	}
}

export const stores = new Stores();
