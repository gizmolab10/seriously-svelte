import { Rect, Point } from '../geometry/Geometry';
import { roundToEven } from '../common/Utilities';
import { writable } from 'svelte/store';

export const id_editingStopped	= writable<string | null>();
export const id_showingTools	= writable<string | null>();
export const id_popupView		= writable<string | null>();
export const db_loadTime 		= writable<string | null>();
export const id_editing			= writable<string | null>();
export const add_parent	 		= writable<string | null>();
export const id_here			= writable<string | null>();
export const ids_grabbed		= writable<string[]>();
export const expanded			= writable<string[]>();
export const things_arrived		= writable<boolean>();
export const showDetails		= writable<boolean>();
export const isBusy				= writable<boolean>();
export const db_type			= writable<string>();
export const thing_fontFamily	= writable<string>();
export const thing_fontSize		= writable<number>();
export const line_stretch		= writable<number>();
export const crumbsWidth		= writable<number>();
export const row_height			= writable<number>();
export const dot_size			= writable<number>();
export const build				= writable<number>();
export const user_graphOffset	= writable<Point>();
export const graphRect			= writable<Rect>();

row_height.subscribe((height) => {
	thing_fontSize.set(roundToEven(height * .7));
	line_stretch.set(roundToEven(height * 1.25));
	dot_size.set(roundToEven(height * .65));
});