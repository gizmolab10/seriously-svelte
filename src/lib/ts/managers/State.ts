import { k, get, Rect, Path, Point, TitleState } from '../common/GlobalImports';
import { signals } from '../common/Signals';
import { writable } from 'svelte/store';
import { u } from '../common/Utilities'; // import separately from globals to avoid recursive initialization
let interval : NodeJS.Timeout | null = null;

export const s_title_editing	= writable<TitleState | null>();
export const s_db_loadTime 		= writable<string | null>();
export const s_id_popupView		= writable<string | null>();
export const s_altering_parent	= writable<string | null>();
export const s_path_toolsGrab	= writable<Path | null>();
export const s_paths_grabbed	= writable<Array<Path>>();
export const s_paths_expanded	= writable<Array<Path>>();
export const s_tools_inWidgets	= writable<boolean>();
export const s_things_arrived	= writable<boolean>();
export const s_showDetails		= writable<boolean>();
export const s_title_atTop		= writable<boolean>();
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
	s_thing_fontSize.set(u.roundToEven(height * .7));
	s_line_stretch.set(u.roundToEven(height * 1.25));
	s_dot_size.set(u.roundToEven(height * .65));
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

export function s_setup() {
	const herePath = get(s_path_here);
	if (!herePath) {
		s_path_here.set(k.rootPath);
	}
	const grabbedPaths = get(s_paths_grabbed);
	if (!grabbedPaths || grabbedPaths.length == 0) {
		s_paths_grabbed.set([k.rootPath]);
	}
}
