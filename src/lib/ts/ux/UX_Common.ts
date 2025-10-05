import { layout, g_tree, T_Kinship, T_Graph, T_Search_Preference } from '../common/Global_Imports';
import { w_show_graph_ofType, w_search_preferences } from '../managers/Stores';
import { get } from 'svelte/store';

class UX_Common {
	
	handle_choiceOf_t_graph(name: string, types: string[]) {
		switch (name) {
			case 'filter': w_search_preferences.set(types[0] as unknown as T_Search_Preference); break;
			case 'graph': w_show_graph_ofType.set(types[0] as unknown as T_Graph); break;
			case 'tree': g_tree.set_tree_types(types as Array<T_Kinship>); break;
		}
	}

	toggle_graph_type() {
		switch (get(w_show_graph_ofType)) {
			case T_Graph.tree:   w_show_graph_ofType.set(T_Graph.radial); break;
			case T_Graph.radial: w_show_graph_ofType.set(T_Graph.tree);   break;
		}
		layout.grand_sweep();
	}
	
}

export const ux_common = new UX_Common();