import { Rect, Path, Point, TitleState } from './GlobalImports';
import { signals } from './Signals';
import { writable } from 'svelte/store';
let interval : NodeJS.Timeout | null = null;

export const s_title_editing	 = writable<TitleState | null>();
export const s_db_loadTime 		 = writable<string | null>();
export const s_id_popupView		 = writable<string | null>();
export const s_altering_parent	 = writable<string | null>();
export const s_path_clusterTools = writable<Path | null>();
export const s_paths_expanded	 = writable<Array<Path>>();
export const s_paths_grabbed	 = writable<Array<Path>>();
export const s_show_child_graph	 = writable<boolean>();
export const s_layout_byClusters	 = writable<boolean>();
export const s_things_arrived	 = writable<boolean>();
export const s_show_details		 = writable<boolean>();
export const s_isBusy			 = writable<boolean>();
export const s_db_type			 = writable<string>();
export const s_thing_fontFamily	 = writable<string>();
export const s_scale_factor		 = writable<number>();
export const s_build			 = writable<number>();
export const s_user_graphOffset	 = writable<Point>();
export const s_graphRect		 = writable<Rect>();
export const s_path_focus		 = writable<Path>();

s_altering_parent.subscribe((alteration: string | null) => {
	if (interval) {
		clearInterval(interval);
		interval = null;
	}
	if (alteration) {
		let blink = true;
		interval = setInterval(() => {
			signals.signal_alteringParent(blink ? alteration : null);
			blink = !blink;
		}, 500)
	} else {
		signals.signal_alteringParent(null);
	}
})
