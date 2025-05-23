import { w_show_details_ofType, w_hierarchy, w_show_traits_ofType, w_ancestry_focus, w_ancestries_grabbed, w_thing_traits } from '../common/Stores';
import { show, Ancestry, T_Details, Trait, T_Trait } from '../common/Global_Imports';
import { get } from 'svelte/store';

class S_Details {
	ancestry: Ancestry = get(w_hierarchy)?.rootAncestry;
	hierarchy_traits: Array<Trait> = [];
	number_ofDetails = 0;
	index_ofTrait = 0;
	total_traits = 0;

	constructor() {
		w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			this.update_forKind();
			this.update_traits();
		});
		w_ancestries_grabbed.subscribe((array: Array<Ancestry>) => {
			this.update_forKind();
			this.update_traits();
		});
		w_show_details_ofType.subscribe((t_details: Array<T_Details>) => {
			this.number_ofDetails = t_details?.length ?? 0;
		});
	}

	get trait(): Trait | null { return this.hierarchy_traits[this.index_ofTrait] ?? null; }

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

	update_traits() {
		this.update_hierarchy_traits();
		const ancestry = this.ancestry;
		const thing = ancestry?.thing ?? null;
		const traits = thing?.traits ?? [];
		w_thing_traits.set(traits);
		if (!!thing && !!traits && traits.length > 0) {
			const index = this.hierarchy_traits.findIndex(t => t.ownerID == thing.id);
			this.index_ofTrait = Math.max(0, index);
		}
	}
	
	update_trait_forColumn(column: number) {
		const h = get(w_hierarchy);
		if (this.hierarchy_traits.length > 0) {
			do {
				this.index_ofTrait = this.index_ofTrait.increment(column != 0, this.total_traits);
			} while (!this.trait?.owner);
		}
		this.hierarchy_traits[this.index_ofTrait]?.owner?.ancestry?.grabOnly();
		h.grabs_latest_assureIsVisible();
		w_hierarchy.set(h);
	}

	update_hierarchy_traits() {
		const h = get(w_hierarchy);
		const titles = get(w_show_traits_ofType);
		if (!!h && !!titles) {
			if (titles.length > 1) {
				this.hierarchy_traits = h.traits ?? [];
			} else {
				this.hierarchy_traits = h.traits_forType(titles[0] as T_Trait) ?? [];
			}
			this.total_traits = this.hierarchy_traits.length;
		}
	}

}

export const s_details = new S_Details();