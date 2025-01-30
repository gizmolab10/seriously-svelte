import { Rect, Point, Ancestry, Hierarchy, G_Cluster, G_Radial } from '../common/Global_Imports';
import { T_Graph, T_Hierarchy, T_Details, T_Startup } from '../common/Global_Imports';
import { S_Paging, S_Title_Edit, S_Alteration } from '../common/Global_Imports';
import { writable } from 'svelte/store';


export const s_hierarchy			  = writable<Hierarchy>();
export const s_ancestries_grabbed	  = writable<Array<Ancestry>>();
export const s_ancestries_expanded	  = writable<Array<Ancestry>>();
export const s_ancestry_showing_tools = writable<Ancestry | null>();
export const s_ancestry_focus		  = writable<Ancestry>();

export const s_s_title_edit			  = writable<S_Title_Edit | null>();
export const s_s_alteration			  = writable<S_Alteration | null>();
export const s_s_paging				  = writable<S_Paging>();

export const s_t_details			  = writable<Array<T_Details>>();
export const s_t_counts				  = writable<Array<T_Hierarchy>>();

export const s_t_database			  = writable<string>();
export const s_t_startup			  = writable<T_Startup>();
export const s_t_graph				  = writable<T_Graph>();
export const s_t_tree				  = writable<T_Hierarchy>();

export const s_g_active_cluster		  = writable<G_Cluster | null>();
export const s_g_radial				  = writable<G_Radial | null>();

export const s_mouse_location_scaled  = writable<Point>();
export const s_user_graph_offset	  = writable<Point>();
export const s_user_graph_center	  = writable<Point>();
export const s_mouse_location		  = writable<Point>();
export const s_graph_rect			  = writable<Rect>();

export const s_id_popupView			  = writable<string | null>();
export const s_thing_title			  = writable<string | null>();
export const s_thing_color			  = writable<string | null>();
export const s_thing_fontFamily		  = writable<string>();
export const s_storage_update_trigger = writable<number>();
export const s_ring_rotation_radius	  = writable<number>();
export const s_ring_rotation_angle	  = writable<number>();
export const s_count_mouse_up		  = writable<number>();
export const s_count_rebuild		  = writable<number>();
export const s_count_resize			  = writable<number>();
export const s_font_size			  = writable<number>();
export const s_show_details			  = writable<boolean>();
export const s_device_isMobile		  = writable<boolean>();
export const s_rebuild_isInProgress	  = writable<boolean>();
