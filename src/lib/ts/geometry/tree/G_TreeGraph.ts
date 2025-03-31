import { w_ancestry_focus } from '../../common/Stores';
import { get } from 'svelte/store';

export default class G_TreeGraph {

	grand_layout_tree() { get(w_ancestry_focus)?.g_widget.layout_tree_fromFocus(); }

}