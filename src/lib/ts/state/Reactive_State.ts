import { Rect, Point, Ancestry, Title_State, Paging_State, Svelte_Wrapper } from '../common/Global_Imports';
import { Rotation_State, Expansion_State, Alteration_State } from '../common/Global_Imports';
import { writable } from 'svelte/store';

export const s_altering				 = writable<Alteration_State | null>();
export const s_active_wrapper		 = writable<Svelte_Wrapper | null>();
export const s_title_editing		 = writable<Title_State | null>();
export const s_ancestry_editingTools = writable<Ancestry | null>();
export const s_ancestries_expanded	 = writable<Array<Ancestry>>();
export const s_ancestries_grabbed	 = writable<Array<Ancestry>>();
export const s_rotation_ring_state	 = writable<Expansion_State>();
export const s_paging_ring_state	 = writable<Rotation_State>();
export const s_thing_changed		 = writable<string | null>();
export const s_id_popupView			 = writable<string | null>();
export const s_db_loadTime 			 = writable<string | null>();
export const s_paging_state			 = writable<Paging_State>();
export const s_ancestry_focus		 = writable<Ancestry>();
export const s_things_arrived		 = writable<boolean>();
export const s_show_details			 = writable<boolean>();
export const s_cluster_mode			 = writable<boolean>();
export const s_isBusy				 = writable<boolean>();
export const s_db_type				 = writable<string>();
export const s_shown_relations		 = writable<string>();
export const s_thing_fontFamily		 = writable<string>();
export const s_rotation_ring_radius	 = writable<number>();
export const s_rotation_ring_angle	 = writable<number>();
export const s_mouse_up_count		 = writable<number>();
export const s_rebuild_count		 = writable<number>();
export const s_resize_count			 = writable<number>();
export const s_scale_factor			 = writable<number>();
export const s_user_graphOffset		 = writable<Point>();
export const s_mouse_location		 = writable<Point>();
export const s_graphRect			 = writable<Rect>();
