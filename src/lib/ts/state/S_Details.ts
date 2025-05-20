import { w_t_details, w_ancestry_focus, w_ancestries_grabbed } from '../common/Stores';
import { show, Ancestry } from '../common/Global_Imports';
import { get } from 'svelte/store';

class S_Details {
	number_ofDetails = (get(w_t_details)?.length ?? 1) - 1;
	ancestry!: Ancestry;
	index_ofTrait = 0;
	total_traits = 0;
	
	constructor(total_traits: number) { this.total_traits = total_traits; }
	grab_next_trait() { this.index_ofTrait = this.index_ofTrait.increment(true, this.total_traits); }
	grab_previous_trait() { this.index_ofTrait = this.index_ofTrait.increment(false, this.total_traits); }

	get hasGrabs(): boolean {
		const grabs = get(w_ancestries_grabbed);
		return !!grabs && (grabs.length > 1 || !get(w_ancestry_focus).isGrabbed);
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

export const s_details = new S_Details(0);