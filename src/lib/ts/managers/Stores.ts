import { T_Graph, T_Kinship, T_Details, T_Startup, T_Auto_Adjust, T_Dragging } from '../common/Global_Imports';
import { Tag, Rect, Point, Trait, colors, Ancestry, Hierarchy } from '../common/Global_Imports';
import { G_Paging, G_Cluster, S_Text_Edit, S_Alteration } from '../common/Global_Imports';
import { writable } from 'svelte/store';

const _____VISIBILITY: unique symbol = Symbol('VISIBILITY');

export const w_show_tree_ofType			 = writable<Array<T_Kinship>>();
export const w_show_countDots_ofType	 = writable<Array<T_Kinship>>();
export const w_show_details_ofType		 = writable<Array<T_Details>>();
export const w_show_directionals_ofType	 = writable<string[]>();
export const w_show_graph_ofType		 = writable<T_Graph>();
export const w_show_related				 = writable<boolean>();
export const w_show_details				 = writable<boolean>();

const _____THING: unique symbol = Symbol('THING');

export const w_thing_tags				 = writable<Array<Tag>>();
export const w_thing_traits				 = writable<Array<Trait>>();
export const w_thing_title				 = writable<string | null>();
export const w_thing_color				 = writable<string | null>();
export const w_thing_fontFamily			 = writable<string>();
export const w_tag_thing_index			 = writable<number>();
export const w_relationship_order		 = writable<number>();
export const w_s_text_edit				 = writable<S_Text_Edit | null>();
export const w_s_alteration				 = writable<S_Alteration | null>();

const _____ANCESTRY: unique symbol = Symbol('ANCESTRY');

export const w_ancestries_expanded		 = writable<Array<Ancestry>>();
export const w_ancestries_grabbed		 = writable<Array<Ancestry>>();
export const w_ancestry_focus			 = writable<Ancestry>();
export const w_hierarchy				 = writable<Hierarchy>();

const _____RADIAL: unique symbol = Symbol('RADIAL');

export const w_g_paging_cluster			 = writable<G_Cluster | null>();
export const w_ring_rotation_radius		 = writable<number>();
export const w_ring_rotation_angle		 = writable<number>();
export const w_g_paging					 = writable<G_Paging>();

const _____GEOMETRY: unique symbol = Symbol('GEOMETRY');

export const w_scaled_movement			 = writable<Point | null>(null);
export const w_mouse_location_scaled	 = writable<Point>();
export const w_user_graph_center		 = writable<Point>();
export const w_user_graph_offset		 = writable<Point>();
export const w_mouse_location			 = writable<Point>();
export const w_graph_rect				 = writable<Rect>();

const _____DATABASE: unique symbol = Symbol('DATABASE');

export const w_t_database				 = writable<string>();
export const w_data_updated				 = writable<number>();

const _____COUNTS: unique symbol = Symbol('COUNTS');

export const w_count_mouse_up			 = writable<number>();
export const w_count_rebuild			 = writable<number>();
export const w_count_details			 = writable<number>();	
export const w_count_resize				 = writable<number>();

const _____OTHER: unique symbol = Symbol('OTHER');

export const w_t_startup				 = writable<T_Startup>();
export const w_dragging_active			 = writable<T_Dragging>();
export const w_auto_adjust_graph		 = writable<T_Auto_Adjust | null>();
export const w_popupView_id				 = writable<string | null>();
export const w_control_key_down			 = writable<boolean>(false);
export const w_device_isMobile			 = writable<boolean>();
export const w_background_color			 = writable<string>();
export const w_depth_limit				 = writable<number>();
export const w_font_size				 = writable<number>();

class Stores {
	setup_defaults() {
		w_count_resize.set(0);
		w_count_rebuild.set(0);
		w_count_details.set(0);
		w_count_mouse_up.set(0);
		w_thing_color.set(null);
		w_s_text_edit?.set(null);
		w_show_details_ofType.set([]);
		w_t_startup.set(T_Startup.start);
		w_background_color.subscribe((color: string) => {
			colors.banner = colors.ofBannerFor(color);
			colors.separator = colors.ofSeparatorFor(color);
		});
	}
}

export const stores = new Stores();
