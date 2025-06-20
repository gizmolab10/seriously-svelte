import { k, p, Rect, Size, Point, debug, layout, T_Banner, T_Preference } from '../common/Global_Imports';
import { w_graph_rect, w_show_details, w_mouse_location_scaled } from '../common/Stores';
import { w_user_graph_offset, w_user_graph_center } from '../common/Stores';
import { get } from 'svelte/store';

export class G_Window {
	scale_factor = 1;
	
	get raw_windowSize(): Size { return new Size(window.innerWidth, window.innerHeight); }
	get windowSize(): Size { return this.raw_windowSize.dividedBy(this.scale_factor); }
	get windowScroll(): Point { return new Point(window.scrollX, window.scrollY); }

	restore_state() {
		layout.graphRect_update();	// needed for applyScale
		this.applyScale(p.read_key(T_Preference.scale) ?? 1);
		layout.renormalize_user_graph_offset();	// must be called after apply scale (which fubars offset)
		document.documentElement.style.setProperty('--css-body-width', this.windowSize.width.toString() + 'px');
	}

	zoomBy(factor: number): number {
		const zoomContainer = document.documentElement;
		const currentScale = parseFloat(getComputedStyle(zoomContainer).getPropertyValue('zoom')) || 1;
		const scale = currentScale * factor;
		this.applyScale(scale);
		return this.windowSize.width;
	}

	applyScale(scale: number) {
		this.scale_factor = scale;
		p.write_key(T_Preference.scale, scale);
		const zoomContainer = document.documentElement;
		zoomContainer.style.setProperty('zoom', scale.toString());
		zoomContainer.style.height = `${100 / scale}%`;
		zoomContainer.style.width = `${100 / scale}%`;
		layout.graphRect_update();
	}

}

export let w = new G_Window();
