import { w_t_details, w_hierarchy, w_ancestry_focus, w_ancestries_grabbed } from '../common/Stores';
import { show, Ancestry, T_Details } from '../common/Global_Imports';
import { get } from 'svelte/store';

class S_Details {
	ancestry: Ancestry = get(w_hierarchy)?.rootAncestry;
	number_ofDetails = 0;
	index_ofTrait = 0;
	total_traits = 0;

	constructor() {
		w_ancestries_grabbed.subscribe((array: Array<Ancestry>) => {
			this.update_forKind();
		});
		w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			this.update_forKind();
		});
		w_t_details.subscribe((t_details: Array<T_Details>) => {
			this.number_ofDetails = t_details?.length ?? 0;
		});
	}
	
	grab_next_trait() {
		do {
			this.index_ofTrait = this.index_ofTrait.increment(true, this.total_traits);
		} while (this.index_ofTrait < this.total_traits);
	}

	grab_previous_trait() {
		do {
			this.index_ofTrait = this.index_ofTrait.increment(false, this.total_traits);
		} while (this.index_ofTrait < this.total_traits);
	}

	get hasGrabs(): boolean {
		const grabs = get(w_ancestries_grabbed);
		return !!grabs && (grabs.length > 0 || !get(w_ancestry_focus).isGrabbed);
	}

	update_forKind() {
		if (show.shows_focus || !this.hasGrabs) {
			this.ancestry = get(w_ancestry_focus);
		} else {
			const grabs = get(w_ancestries_grabbed);
			if (!!grabs && grabs.length > 0) {
				this.ancestry = grabs[0];
			}
		}
	}

}

export const s_details = new S_Details();