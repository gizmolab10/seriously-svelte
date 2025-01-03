import { Tree_Type, Hierarchy, Cluster_Map, Details_Type, Clusters_Geometry, Alteration_State } from '../common/Global_Imports';
import { Rect, Point, Ancestry, Graph_Type, Title_Edit_State, Paging_State, Startup_State } from '../common/Global_Imports';
import { writable } from 'svelte/store';

export const s_clusters_geometry	  = writable<Clusters_Geometry | null>();
export const s_alteration_mode		  = writable<Alteration_State | null>();
export const s_detail_types			  = writable<Array<Details_Type>>();
export const s_active_cluster_map	  = writable<Cluster_Map | null>();
export const s_title_edit_state		  = writable<Title_Edit_State | null>();
export const s_ancestry_showing_tools = writable<Ancestry | null>();
export const s_expanded_ancestries	  = writable<Array<Ancestry>>();
export const s_grabbed_ancestries	  = writable<Array<Ancestry>>();
export const s_startup_state		  = writable<Startup_State>();
export const s_thing_title			  = writable<string | null>();
export const s_thing_color			  = writable<string | null>();
export const s_db_loadTime 			  = writable<string | null>();
export const s_id_popupView			  = writable<string | null>();
export const s_paging_state			  = writable<Paging_State>();
export const s_graph_type			  = writable<Graph_Type>();
export const s_tree_type			  = writable<Tree_Type>();
export const s_hierarchy			  = writable<Hierarchy>();
export const s_focus_ancestry		  = writable<Ancestry>();
export const s_rebuild_isInProgress	  = writable<boolean>();
export const s_device_isMobile		  = writable<boolean>();
export const s_show_details			  = writable<boolean>();
export const s_db_type				  = writable<string>();
export const s_thing_fontFamily		  = writable<string>();
export const s_ring_rotation_radius	  = writable<number>();
export const s_rotation_ring_angle	  = writable<number>();
export const s_number_ofThings		  = writable<number>();
export const s_mouse_up_count		  = writable<number>();
export const s_rebuild_count		  = writable<number>();
export const s_resize_count			  = writable<number>();
export const s_font_size			  = writable<number>();
export const s_mouse_location		  = writable<Point>();
export const s_user_graph_offset	  = writable<Point>();
export const s_user_graph_center	  = writable<Point>();
export const s_scaled_mouse_location  = writable<Point>();
export const s_graphRect			  = writable<Rect>();
