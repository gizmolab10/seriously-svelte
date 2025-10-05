import { w_show_graph_ofType, w_search_preferences, w_popupView_id, w_s_alteration } from '../managers/Stores';
import { T_Control, T_Alteration, T_Search_Preference, T_Graph, T_Kinship } from '../common/Global_Imports';
import { c, e, k, layout, g_tree, Ancestry, Predicate, S_Alteration } from '../common/Global_Imports';
import { w_show_details } from '../managers/Stores';
import { get } from 'svelte/store';

class UX_Common {
	
	open_tabFor(url: string) { window.open(url, 'help-webseriously')?.focus(); }
	get inTreeMode(): boolean { return get(w_show_graph_ofType) == T_Graph.tree; }
	get inRadialMode(): boolean { return get(w_show_graph_ofType) == T_Graph.radial; }
	showHelp() { this.open_tabFor(c.isServerLocal ? k.help_url.local : k.help_url.remote); }

	togglePopupID(id: T_Control) {
		const same = get(w_popupView_id) == id
		w_popupView_id.set(same ? null : id); 
	}

	showHelpFor(t_action: number, column: number) { 
		const page = e.help_page_forActionAt(t_action, column);
		const url = `${k.help_url.remote}/user_guide/${page}`;
		this.open_tabFor(url);
	}

	toggle_alteration(ancestry: Ancestry, t_alteration: T_Alteration, predicate: Predicate | null) {
		const isAltering = !!get(w_s_alteration);
		const s_alteration = isAltering ? null : new S_Alteration(ancestry, t_alteration, predicate);
		w_s_alteration.set(s_alteration);
	}
	
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

	toggle_details() {
		const show_details = !get(w_show_details);
		w_show_details.set(show_details);
		if (show_details) {
			c.show_standalone_UI = true;
		}
	}

}

export const ux = new UX_Common();