import { w_show_details_ofType, w_show_traits_ofType, w_ancestries_grabbed } from '../common/Stores';
import { w_hierarchy, w_t_database, w_thing_traits, w_ancestry_focus } from '../common/Stores';
import { show, Ancestry, T_Details, Trait, T_Trait } from '../common/Global_Imports';
import { get } from 'svelte/store';

class S_Details {
	ancestry: Ancestry = get(w_hierarchy)?.rootAncestry;
	hierarchy_traits: Array<Trait> = [];
	number_ofDetails = 0;
	index_ofTrait = 0;
	total_traits = 0;

	constructor() {
		w_t_database.subscribe((db: string) => {
			this.update();
		});
		w_ancestry_focus.subscribe((ancestry: Ancestry) => {
			this.update();
		});
		w_ancestries_grabbed.subscribe((array: Array<Ancestry>) => {
			this.update();
		});
		w_show_details_ofType.subscribe((t_details: Array<T_Details>) => {
			this.number_ofDetails = t_details?.length ?? 0;
		});
	}

	get trait(): Trait | null { return this.hierarchy_traits[this.index_ofTrait] ?? null; }

	get hasGrabs(): boolean {
		const grabs = get(w_ancestries_grabbed);
		if (!grabs || grabs.length === 0) { return false; }
		return !(get(w_ancestry_focus)?.isGrabbed ?? true);
	}

	update() {
		this.update_forKind_ofInfo();
		this.update_traits();
	}

	update_forKind_ofInfo() {
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
		const thing = this.ancestry?.thing ?? null;
		const thing_traits = thing?.traits ?? [];
		if (!!thing && !!thing_traits && thing_traits.length > 0) {
			const index = this.hierarchy_traits.findIndex(t => t.ownerID == thing.id);
			this.index_ofTrait = Math.max(0, index);
			w_thing_traits.set(thing_traits);
		}
	}
	
	select_nextTrait(next: boolean) {
		if (this.find_next_trait(next)) {
			const h = get(w_hierarchy);
			this.trait?.owner?.ancestry?.grabOnly();
			h.grabs_latest_assureIsVisible();
			w_hierarchy.set(h);
		}
	}

	private find_next_trait(next: boolean): boolean {
		let index = this.hierarchy_traits.length;
		while (index > 0) {		// prevent infinite loop if no trait is found
			this.index_ofTrait = this.index_ofTrait.increment(next, this.total_traits);
			if (!!this.trait?.owner) {
				return true;
			}
			index--;
		}
		return false;
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