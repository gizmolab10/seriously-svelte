import { w_show_graph_ofType, w_search_preferences, w_popupView_id, w_s_alteration } from '../managers/Stores';
import { T_Control, T_Alteration, T_Search_Preference, T_Graph, T_Kinship } from '../common/Global_Imports';
import { c, e, k, layout, g_tree, Ancestry, Predicate, S_Alteration } from '../common/Global_Imports';
import { get } from 'svelte/store';

class UX_Controls {
	
	open_tabFor(url: string) { window.open(url, 'help-webseriously')?.focus(); }
	get inTreeMode(): boolean { return get(w_show_graph_ofType) == T_Graph.tree; }
	get inRadialMode(): boolean { return get(w_show_graph_ofType) == T_Graph.radial; }
	showHelp_home() { this.open_tabFor(c.isServerLocal ? k.help_url.local : k.help_url.remote); }

	togglePopupID(id: T_Control) {
		const same = get(w_popupView_id) == id
		w_popupView_id.set(same ? null : id); 
	}

	showHelp_for(t_action: number, column: number) { 
		const page = e.help_page_forActionAt(t_action, column);
		const url = `${k.help_url.remote}/user_guide/${page}`;
		this.open_tabFor(url);
	}

	toggle_alteration(ancestry: Ancestry, t_alteration: T_Alteration, predicate: Predicate | null) {
		const isAltering = !!get(w_s_alteration);
		const s_alteration = isAltering ? null : new S_Alteration(ancestry, t_alteration, predicate);
		w_s_alteration.set(s_alteration);
	}
	
	handle_segmented_choices(segmented_name: string, choices: string[]) {
		switch (segmented_name) {
			case 'search': w_search_preferences.set(choices[0] as unknown as T_Search_Preference); break;
			case 'graph':  w_show_graph_ofType.set(choices[0] as unknown as T_Graph); break;
			case 'tree':   g_tree.set_tree_types(choices as Array<T_Kinship>); break;
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

export const controls = new UX_Controls();