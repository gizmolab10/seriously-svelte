import { w_ancestry_focus, w_device_isMobile } from '../../ts/common/Stores';
import { w_graph_rect, w_show_details  } from '../../ts/common/Stores';
import { k, debug, T_GraphMode } from '../common/Global_Imports';
import { get } from 'svelte/store';

export default class G_TreeGraph {

	update_origins() {
		const graphRect = get(w_graph_rect);
		const focusAncestry = get(w_ancestry_focus);
		if (!!focusAncestry && !!graphRect) {
			const offsetY = graphRect.origin.y + 1;
			const childrenSize = focusAncestry.visibleProgeny_size;
			const offsetX_ofFirstReveal = (focusAncestry.thing?.titleWidth ?? 0) / 2 - 2;
			const child_offsetY = (k.dot_size / 2) -(childrenSize.height / 2) - 4;
			const child_offsetX = -37 + k.line_stretch - (k.dot_size / 2) + offsetX_ofFirstReveal;
			const offsetX = (get(w_show_details) ? -k.width_details : 0) + 15 + offsetX_ofFirstReveal - (childrenSize.width / 2) - (k.dot_size / 2.5);
			const origin_ofFocusReveal = graphRect.center.offsetByXY(offsetX, -offsetY);
			if (get(w_device_isMobile)) {
				origin_ofFocusReveal.x = 25;
			}
			const origin_ofChildren = origin_ofFocusReveal.offsetByXY(child_offsetX, child_offsetY);
			focusAncestry.g_widget.update(T_GraphMode.tree, origin_ofChildren);
			debug.log_origins(origin_ofChildren.x + ' update_origins');
		}
	}

}