import { Rect, Path, Point, TitleState, roundToEven } from '../common/GlobalImports';
import { signals } from '../common/Signals';
import { writable } from 'svelte/store';
let interval : NodeJS.Timeout | null = null;

export const s_title_editing	= writable<TitleState | null>();
export const s_db_loadTime 		= writable<string | null>();
export const s_id_popupView		= writable<string | null>();
export const s_altering_parent	= writable<string | null>();
export const s_path_toolsGrab	= writable<Path | null>();
export const s_paths_grabbed	= writable<Array<Path>>();
export const s_paths_expanded	= writable<Array<Path>>();
export const s_things_arrived	= writable<boolean>();
export const s_showDetails		= writable<boolean>();
export const s_isBusy			= writable<boolean>();
export const s_db_type			= writable<string>();
export const s_thing_fontFamily	= writable<string>();
export const s_thing_fontSize	= writable<number>();
export const s_line_stretch		= writable<number>();
export const s_crumbs_width		= writable<number>();
export const s_row_height		= writable<number>();
export const s_dot_size			= writable<number>();
export const s_build			= writable<number>();
export const s_user_graphOffset	= writable<Point>();
export const s_graphRect		= writable<Rect>();
export const s_path_here		= writable<Path>();

s_row_height.subscribe((height) => {
	s_thing_fontSize.set(roundToEven(height * .7));
	s_line_stretch.set(roundToEven(height * 1.25));
	s_dot_size.set(roundToEven(height * .65));
});

s_altering_parent.subscribe((alteration: string | null)=> {
	if (alteration) {
		let blink= true;
		interval= setInterval(() => {
			signals.signal_alteringParent(blink ? alteration : null);
			blink= !blink;
		}, 500)
	} else {
		if (interval) {
			clearInterval(interval);
		}
		signals.signal_alteringParent(null);
	}
})