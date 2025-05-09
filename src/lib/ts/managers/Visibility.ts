import { w_e_countDots, w_show_details, w_show_related, w_device_isMobile } from '../common/Stores';
import { c, k, p, w, layout, E_Preference } from '../common/Global_Imports';
import { E_Report, E_Kinship } from '../common/Enumerations';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';

export class Visibility {
	debug_cursor	= false;
	traits			= false;
	e_info			= E_Report.focus;
	tool_separators	= !(get(w_device_isMobile) ?? false);

	queryStrings_apply() {
		const queryStrings = c.queryStrings;
		const hiddenNames = queryStrings.get('hide')?.split(k.comma) ?? [];
		const visibleNames = queryStrings.get('show')?.split(k.comma) ?? [];
		const hidden = Object.fromEntries(hiddenNames.map(s => [s, false]) ?? {});
		const visible = Object.fromEntries(visibleNames.map(s => [s, true]) ?? {});
		const keyedFlags: Dictionary<boolean> = {...visible, ...hidden};
        for (const [name, flag] of Object.entries(keyedFlags)) {
			switch (name) {
				case 'details':
					w_show_details.set(flag);
					break;
				case 'related':
					w_show_related.set(flag);
					break;
				case 'traits':
					this.traits = flag;
					p.write_key(E_Preference.traits, flag);
					break;
				case 'parents':
					const mode = flag ? E_Kinship.parent : E_Kinship.child;
					layout.set_t_tree([mode]);
					break;
			}
		}
	}

	showing_countDots_ofType(e_counts: E_Kinship): boolean { return get(w_e_countDots).includes(E_Kinship[e_counts]) }
	get children_dots(): boolean { return  this.showing_countDots_ofType(E_Kinship.child); }
	get related_dots(): boolean { return  this.showing_countDots_ofType(E_Kinship.related); }
	get parent_dots(): boolean { return  this.showing_countDots_ofType(E_Kinship.parent); }
	
	restore_state() {
		this.traits = p.read_key(E_Preference.traits) ?? false;
		this.e_info = p.read_key(E_Preference.info) ?? E_Report.focus;
		w_show_details.set(p.read_key(E_Preference.show_details) ?? false);
		w_show_related.set(p.read_key(E_Preference.show_related) ?? false);
	}

	reactivity_subscribe() {
		w_device_isMobile.subscribe((flag: boolean) => {
			this.tool_separators = !flag;
		});
		w_show_details.subscribe((flag: boolean) => {
			p.write_key(E_Preference.show_details, flag);
			w.restore_state();
			layout.grand_layout();
		});
		w_show_related.subscribe((flag: boolean) => {
			p.write_key(E_Preference.show_related, flag);
			w.restore_state();
			layout.grand_layout();
		});
    }
}

export let show = new Visibility();