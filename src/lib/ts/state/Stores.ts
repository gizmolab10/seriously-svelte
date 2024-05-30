import { Rect, Point, Ancestry, Title, Alteration } from '../common/GlobalImports';
import { writable } from 'svelte/store';
import { signals } from '../events/Signals';

export const s_altering				 = writable<Alteration | null>();
export const s_title_editing		 = writable<Title | null>();
export const s_ancestry_editingTools = writable<Ancestry | null>();
export const s_ancestries_expanded	 = writable<Array<Ancestry>>();
export const s_ancestries_grabbed	 = writable<Array<Ancestry>>();
export const s_db_loadTime 			 = writable<string | null>();
export const s_id_popupView			 = writable<string | null>();
export const s_ancestry_focus		 = writable<Ancestry>();
export const s_layout_asClusters	 = writable<boolean>();
export const s_things_arrived		 = writable<boolean>();
export const s_show_details			 = writable<boolean>();
export const s_isBusy				 = writable<boolean>();
export const s_db_type				 = writable<string>();
export const s_thing_changed		 = writable<string>();
export const s_graph_relations		 = writable<string>();
export const s_thing_fontFamily		 = writable<string>();
export const s_cluster_arc_radius	 = writable<number>();
export const s_mouse_up_count		 = writable<number>();
export const s_rebuild_count		 = writable<number>();
export const s_resize_count			 = writable<number>();
export const s_scale_factor			 = writable<number>();
export const s_ring_angle			 = writable<number>();
export const s_user_graphOffset		 = writable<Point>();
export const s_mouse_location		 = writable<Point>();
export const s_graphRect			 = writable<Rect>();

let interval: NodeJS.Timeout | null = null;

s_altering.subscribe((state: Alteration | null) => {
	if (interval) {
		clearInterval(interval);
		interval = null;
	}
	if (state) {
		let blink = true;
		interval = setInterval(() => {
			signals.signal_altering(blink ? state : null);
			blink = !blink;
		}, 500)
	} else {
		signals.signal_altering(null);
	}
})
