import { Rect, Path, Point, roundToEven } from '../common/GlobalImports';
import { signals } from '../common/Signals';
import { writable } from 'svelte/store';
let interval : NodeJS.Timeout | null = null;

export const db_loadTime 		 = writable<string | null>();
export const id_popupView		 = writable<string | null>();
export const altering_parent 	 = writable<string | null>();
export const path_editingStopped = writable<Path | null>();
export const path_toolsGrab		 = writable<Path | null>();
export const path_editing		 = writable<Path | null>();
export const path_here			 = writable<Path | null>();
export const paths_grabbed		 = writable<Array<Path>>();
export const paths_expanded		 = writable<Array<Path>>();
export const things_arrived		 = writable<boolean>();
export const showDetails		 = writable<boolean>();
export const isBusy				 = writable<boolean>();
export const db_type			 = writable<string>();
export const thing_fontFamily	 = writable<string>();
export const thing_fontSize		 = writable<number>();
export const line_stretch		 = writable<number>();
export const crumbsWidth		 = writable<number>();
export const row_height			 = writable<number>();
export const dot_size			 = writable<number>();
export const build				 = writable<number>();
export const user_graphOffset	 = writable<Point>();
export const graphRect			 = writable<Rect>();

row_height.subscribe((height) => {
	thing_fontSize.set(roundToEven(height * .7));
	line_stretch.set(roundToEven(height * 1.25));
	dot_size.set(roundToEven(height * .65));
});

altering_parent.subscribe((alteration: string | null) => {
	if (alteration) {
		let blink = true;
		interval = setInterval(() => {
			signals.signal_alteringParent(blink ? alteration : null);
			blink = !blink;
		}, 500)
	} else {
		if (interval) {
			clearInterval(interval);
		}
		signals.signal_alteringParent(null);
	}
})