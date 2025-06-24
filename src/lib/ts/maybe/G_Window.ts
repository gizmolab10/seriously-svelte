import { p, Size, Point, layout, T_Preference } from '../common/Global_Imports';

export class G_Window {
	scale_factor = 1;
	
	get raw_windowSize(): Size { return new Size(window.innerWidth, window.innerHeight); }
	get windowSize(): Size { return this.raw_windowSize.dividedBy(this.scale_factor); }
	get windowScroll(): Point { return new Point(window.scrollX, window.scrollY); }

	restore_state() {
		layout.graphRect_update();	// needed for set_scale_factor
		this.set_scale_factor(p.read_key(T_Preference.scale) ?? 1);
		layout.renormalize_user_graph_offset();	// must be called after apply scale (which fubars offset)
		document.documentElement.style.setProperty('--css-body-width', this.windowSize.width.toString() + 'px');
	}

	scaleBy(factor: number): number {
		const zoomContainer = document.documentElement;
		const currentScale = parseFloat(getComputedStyle(zoomContainer).getPropertyValue('zoom')) || 1;
		const scale = currentScale * factor;
		this.set_scale_factor(scale);
		return this.windowSize.width;
	}

	set_scale_factor(scale_factor: number) {
		this.scale_factor = scale_factor;
		p.write_key(T_Preference.scale, scale_factor);
		const zoomContainer = document.documentElement;
		zoomContainer.style.setProperty('zoom', scale_factor.toString());
		zoomContainer.style.height = `${100 / scale_factor}%`;
		zoomContainer.style.width = `${100 / scale_factor}%`;
		layout.graphRect_update();
	}

}

export let w = new G_Window();
