import { T_Graph, T_Detail, T_Kinship, T_Preference } from '../common/Global_Imports';
import { k, p, x, g_tree, layout, features } from '../common/Global_Imports';
import type { Dictionary } from '../types/Types';
import { get, writable } from 'svelte/store';

export class Visibility {
	w_show_tree_ofType			= writable<Array<T_Kinship>>();
	w_show_countDots_ofType		= writable<Array<T_Kinship>>();
	w_show_details_ofType		= writable<Array<T_Detail>>([]);	
	w_show_graph_ofType			= writable<T_Graph>(T_Graph.tree);
	w_show_directionals_ofType	= writable<boolean[]>([false, true]);
	w_show_save_data_button		= writable<boolean>(false);
	w_show_search_controls		= writable<boolean>(false);
	w_show_related				= writable<boolean>(false);
	w_show_details				= writable<boolean>(true);
	w_show_other_databases		= writable<boolean>(true);
	w_show_radial_forks			= writable<boolean>(true);
	debug_cursor				= false;

	constructor() {
		this.w_show_details_ofType.subscribe((t_details: Array<T_Detail>) => {
			x.update_grabs_forSearch();
		});
	}

	apply_queryStrings(queryStrings: URLSearchParams) {
		const levels = queryStrings.get('levels');
		const hiddenNames = queryStrings.get('hide')?.split(k.comma) ?? [];
		const visibleNames = queryStrings.get('show')?.split(k.comma) ?? [];
		const hidden = Object.fromEntries(hiddenNames.map(s => [s, false]) ?? {});
		const visible = Object.fromEntries(visibleNames.map(s => [s, true]) ?? {});
		const keyedFlags: Dictionary<boolean> = {...visible, ...hidden};
		if (!!levels) {
			layout.w_depth_limit.set(Number(levels));
		}
        for (const [name, flag] of Object.entries(keyedFlags)) {
			switch (name) {
				case 'details':
					this.w_show_details.set(flag);
					break;
				case 'related':
					this.w_show_related.set(flag);
					break;
				case 'radial_forks':
					this.w_show_radial_forks.set(flag);
					break;
				case 'parents':
					const mode = flag ? T_Kinship.parents : T_Kinship.children;
					g_tree.set_tree_types([mode]);
					break;
			}
		}
	}

	isShowing_countDots_ofType(t_counts: T_Kinship): boolean { return get(this.w_show_countDots_ofType).includes(T_Kinship[t_counts]) }
	get children_dots(): boolean { return  this.isShowing_countDots_ofType(T_Kinship.children); }
	get related_dots(): boolean { return  this.isShowing_countDots_ofType(T_Kinship.related); }
	get parent_dots(): boolean { return  this.isShowing_countDots_ofType(T_Kinship.parents); }

	toggle_show_other_databases() {
		const other_databases = !get(this.w_show_other_databases)
		p.write_key(T_Preference.other_databases, other_databases);
		this.w_show_other_databases.set(other_databases);
	}

	restore_preferences() {
		this.w_show_countDots_ofType.set(p.read_key(T_Preference.countDots)		  ?? []);
		this.w_show_details			.set(p.read_key(T_Preference.show_details)	  ?? false);
		this.w_show_related			.set(p.read_key(T_Preference.show_related)	  ?? false);
		this.w_show_radial_forks	.set(p.read_key(T_Preference.radial_forks)  ?? false);
		this.w_show_other_databases	.set(p.read_key(T_Preference.other_databases) ?? false);
		this.w_show_tree_ofType		.set(p.read_key(T_Preference.tree)			  ?? T_Kinship.children);
		this.w_show_details_ofType	.set(p.read_key(T_Preference.detail_types)	  ?? [T_Detail.actions, T_Detail.data]);
		this.w_show_graph_ofType	.set(features.allow_tree_mode ? p.read_key(T_Preference.graph) ?? T_Graph.tree : T_Graph.radial);
	}
	
	reactivity_subscribe() {
		function writeAnd_reactTo(t_preference: T_Preference, flag: any) {
			p.write_key(t_preference, flag);
			layout.restore_preferences();
			layout.grand_layout();
		}
		this.w_show_details.subscribe((flag: any) => {
			writeAnd_reactTo(T_Preference.show_details, flag);
		});
		this.w_show_related.subscribe((flag: any) => {
			writeAnd_reactTo(T_Preference.show_related, flag);
		});
		this.w_show_graph_ofType.subscribe((flag: any) => {
			writeAnd_reactTo(T_Preference.graph, flag);
		});
		this.w_show_search_controls.subscribe((flag: any) => {
			writeAnd_reactTo(T_Preference.show_related, flag);
		});
    }
}

export const show = new Visibility();