import { Rect, Point, Ancestry, Hierarchy, Cluster_Map, Radial_Geometry } from '../common/Global_Imports';
import { T_Tree, T_Details, T_Graph, T_Startup } from '../common/Global_Imports';
import { S_Paging, S_Title_Edit, S_Alteration } from '../common/Global_Imports';
import { writable } from 'svelte/store';

export const s_detail_types			  = writable<Array<T_Details>>();
export const s_grabbed_ancestries	  = writable<Array<Ancestry>>();
export const s_expanded_ancestries	  = writable<Array<Ancestry>>();

export const s_radial_geometry		  = writable<Radial_Geometry | null>();
export const s_alteration_mode		  = writable<S_Alteration | null>();
export const s_title_edit_state		  = writable<S_Title_Edit | null>();
export const s_active_cluster_map	  = writable<Cluster_Map | null>();
export const s_ancestry_showing_tools = writable<Ancestry | null>();
export const s_focus_ancestry		  = writable<Ancestry>();
export const s_paging_state			  = writable<S_Paging>();
export const s_hierarchy			  = writable<Hierarchy>();

export const s_startup_state		  = writable<T_Startup>();
export const s_graph_type			  = writable<T_Graph>();
export const s_tree_type			  = writable<T_Tree>();
export const s_mouse_location		  = writable<Point>();
export const s_user_graph_offset	  = writable<Point>();
export const s_user_graph_center	  = writable<Point>();
export const s_scaled_mouse_location  = writable<Point>();
export const s_graphRect			  = writable<Rect>();

export const s_id_popupView			  = writable<string | null>();
export const s_thing_title			  = writable<string | null>();
export const s_thing_color			  = writable<string | null>();
export const s_type_db				  = writable<string>();
export const s_thing_fontFamily		  = writable<string>();
export const s_storage_update_trigger = writable<number>();
export const s_ring_rotation_radius	  = writable<number>();
export const s_rotation_ring_angle	  = writable<number>();
export const s_mouse_up_count		  = writable<number>();
export const s_rebuild_count		  = writable<number>();
export const s_resize_count			  = writable<number>();
export const s_font_size			  = writable<number>();
export const s_show_details			  = writable<boolean>();
export const s_device_isMobile		  = writable<boolean>();
export const s_rebuild_isInProgress	  = writable<boolean>();
