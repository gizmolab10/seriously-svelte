import { T_Info, T_Graph, T_Trait, T_Kinship, T_Details, T_Startup } from '../common/Global_Imports';
import { Rect, Point, colors, Ancestry, Hierarchy, G_Cluster, Trait } from '../common/Global_Imports';
import { G_Paging, S_Title_Edit, S_Alteration } from '../common/Global_Imports';
import { writable } from 'svelte/store';

const _____VISIBILITY: unique symbol = Symbol('VISIBILITY');

export const w_show_tree_ofType			 = writable<Array<T_Kinship>>();
export const w_show_countDots_ofType	 = writable<Array<T_Kinship>>();
export const w_show_details_ofType		 = writable<Array<T_Details>>();
export const w_show_traits_ofType		 = writable<Array<T_Trait>>();
export const w_show_graph_ofType		 = writable<T_Graph>();
export const w_show_info_ofType			 = writable<T_Info>();
export const w_show_related				 = writable<boolean>();
export const w_show_details				 = writable<boolean>();
export const w_show_directionals_ofType	 = writable<Array<string>>();

const _____THING: unique symbol = Symbol('THING');

export const w_thing_traits				 = writable<Array<Trait>>();
export const w_thing_title				 = writable<string | null>();
export const w_thing_color				 = writable<string | null>();
export const w_thing_fontFamily			 = writable<string>();
export const w_relationship_order		 = writable<number>();
export const w_s_title_edit				 = writable<S_Title_Edit | null>();
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

export const w_mouse_location_scaled	 = writable<Point>();
export const w_user_graph_center		 = writable<Point>();
export const w_user_graph_offset		 = writable<Point>();
export const w_mouse_location			 = writable<Point>();
export const w_graph_rect				 = writable<Rect>();

const _____DATABASE: unique symbol = Symbol('DATABASE');

export const w_t_database				 = writable<string>();
export const w_storage_updated			 = writable<number>();

const _____COUNTS: unique symbol = Symbol('COUNTS');

export const w_count_mouse_up			 = writable<number>();
export const w_count_rebuild			 = writable<number>();
export const w_count_resize				 = writable<number>();

const _____OTHER: unique symbol = Symbol('OTHER');

export const w_popupView_id				 = writable<string | null>();
export const w_t_startup				 = writable<T_Startup>();
export const w_device_isMobile			 = writable<boolean>();
export const w_background_color			 = writable<string>();
export const w_font_size				 = writable<number>();

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
