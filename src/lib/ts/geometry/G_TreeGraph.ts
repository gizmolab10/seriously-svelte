import { k, Rect, debug, T_Line, G_Widget, T_Widget } from '../common/Global_Imports';
import { w_hierarchy, w_graph_rect, w_show_details  } from '../../ts/common/Stores';
import { w_ancestry_focus, w_device_isMobile } from '../../ts/common/Stores';
import { get } from 'svelte/store';

export default class G_TreeGraph {
	g_focus_widget!: G_Widget;

	update_origins() {
		const graphRect = get(w_graph_rect);
		const focusAncestry = get(w_ancestry_focus);
		const focus = !!focusAncestry ? focusAncestry.thing : get(w_hierarchy)?.root;
		if (!!focus && !!graphRect) {
			const offsetY = graphRect.origin.y + 1;
			const childrenSize = focusAncestry.visibleProgeny_size;
			const offsetX_ofFirstReveal = focus?.titleWidth / 2 - 2;
			const child_offsetY = (k.dot_size / 2) -(childrenSize.height / 2) - 4;
			const child_offsetX = -37 + k.line_stretch - (k.dot_size / 2) + offsetX_ofFirstReveal;
			const offsetX = (get(w_show_details) ? -k.width_details : 0) + 15 + offsetX_ofFirstReveal - (childrenSize.width / 2) - (k.dot_size / 2.5);
			const origin_ofFirstReveal = graphRect.center.offsetByXY(offsetX, -offsetY);
			if (get(w_device_isMobile)) {
				origin_ofFirstReveal.x = 25;
			}
			const origin_ofChildren = origin_ofFirstReveal.offsetByXY(child_offsetX, child_offsetY);
			this.g_focus_widget = new G_Widget(Rect.zero, T_Widget.focus, T_Line.flat, origin_ofChildren, focusAncestry, null);
			debug.log_origins(origin_ofChildren.x + ' update_origins');
		}
	}

	relayout_recursively() {
		this.update_origins();
		this.g_focus_widget.relayout_recursively();
	}

}