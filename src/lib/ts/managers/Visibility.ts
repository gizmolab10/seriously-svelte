import { T_Graph, T_Detail, T_Kinship, T_Preference } from '../common/Global_Imports';
import { c, k, p, x, g_tree, layout } from '../common/Global_Imports';
import type { Dictionary } from '../types/Types';
import { get, writable } from 'svelte/store';

export class Visibility {
	w_tree_ofType			= writable<Array<T_Kinship>>();
	w_countDots_ofType		= writable<Array<T_Kinship>>();
	w_details_ofType		= writable<Array<T_Detail>>([]);	
	w_directionals_ofType	= writable<string[]>();
	w_graph_ofType			= writable<T_Graph>();
	w_details				= writable<boolean>();
	w_other_databases		= writable<boolean>();
	w_related				= writable<boolean>();
	w_save_data_button		= writable<boolean>();
	w_search_controls		= writable<boolean>();
	w_depth_limit			= writable<number>();
	debug_cursor			= false;

	constructor() {
		this.w_details_ofType.subscribe((t_details: Array<T_Detail>) => {
			x.update_grabs_forSearch();
		});
	}

	apply_queryStrings() {
		const queryStrings = c.queryStrings;
		const levels = queryStrings.get('levels');
		const hiddenNames = queryStrings.get('hide')?.split(k.comma) ?? [];
		const visibleNames = queryStrings.get('show')?.split(k.comma) ?? [];
		const hidden = Object.fromEntries(hiddenNames.map(s => [s, false]) ?? {});
		const visible = Object.fromEntries(visibleNames.map(s => [s, true]) ?? {});
		const keyedFlags: Dictionary<boolean> = {...visible, ...hidden};
		if (!!levels) {
			this.w_depth_limit.set(Number(levels));
		}
        for (const [name, flag] of Object.entries(keyedFlags)) {
			switch (name) {
				case 'details':
					this.w_details.set(flag);
					break;
				case 'related':
					this.w_related.set(flag);
					break;
				case 'parents':
					const mode = flag ? T_Kinship.parents : T_Kinship.children;
					g_tree.set_tree_types([mode]);
					break;
			}
		}
	}

	isShowing_countDots_ofType(t_counts: T_Kinship): boolean { return get(this.w_countDots_ofType).includes(T_Kinship[t_counts]) }
	get children_dots(): boolean { return  this.isShowing_countDots_ofType(T_Kinship.children); }
	get related_dots(): boolean { return  this.isShowing_countDots_ofType(T_Kinship.related); }
	get parent_dots(): boolean { return  this.isShowing_countDots_ofType(T_Kinship.parents); }

	toggle_show_other_databases() {
		const other_databases = !get(this.w_other_databases)
		p.write_key(T_Preference.other_databases, other_databases);
		this.w_other_databases.set(other_databases);
	}

	restore_preferences() {
		this.w_depth_limit		.set(p.read_key(T_Preference.levels)		  ?? 12);
		this.w_details			.set(p.read_key(T_Preference.show_details)	  ?? false);
		this.w_related			.set(p.read_key(T_Preference.show_related)	  ?? false);
		this.w_other_databases	.set(p.read_key(T_Preference.other_databases) ?? false);
		this.w_tree_ofType		.set(p.read_key(T_Preference.tree)			  ?? T_Kinship.children);
		this.w_countDots_ofType	.set(p.read_key(T_Preference.countDots)		  ?? [T_Kinship.children]);
		this.w_details_ofType	.set(p.read_key(T_Preference.detail_types)	  ?? [T_Detail.actions, T_Detail.data]);
		this.w_graph_ofType		.set(c.allow_tree_mode ? p.read_key(T_Preference.graph) ?? T_Graph.tree : T_Graph.radial);
	}
	
	reactivity_subscribe() {
		function reactTo(t_preference: T_Preference, flag: any) {
			p.write_key(t_preference, flag);
			layout.restore_preferences();
			layout.grand_layout();
		}
		this.w_details.subscribe((flag: any) => {
			reactTo(T_Preference.show_details, flag);
		});
		this.w_related.subscribe((flag: any) => {
			reactTo(T_Preference.show_related, flag);
		});
		this.w_graph_ofType.subscribe((flag: any) => {
			reactTo(T_Preference.graph, flag);
		});
		this.w_search_controls.subscribe((flag: any) => {
			reactTo(T_Preference.show_related, flag);
		});
    }
}

export const show = new Visibility();