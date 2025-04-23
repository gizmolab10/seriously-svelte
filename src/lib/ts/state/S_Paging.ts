import { w_hierarchy, w_s_paging, w_ring_rotation_radius } from '../common/Stores';
import { k, Thing, Predicate, Ancestry, G_Cluster } from '../common/Global_Imports';
import type { Dictionary } from '../common/Types';
import { get } from 'svelte/store';

export class S_Paging {

	// a page is a subset of a too-long list of things
	// widgets_shown == length of subset
	// thing id refers to "owner"
	// index == first of subset

	points_toChildren = false;
	thing_id = k.empty;
	widgets_shown = 0;
	total_widgets = 0;
	kind = k.empty;
	index = 0;			// this value changes when user moves paging arc [thumb] slider, or when widget needs to be visible and isn't

	constructor(index: number = 0, widgets_shown: number = 0, total_widgets: number = 0) {
		this.index = index.force_asInteger_between(0, total_widgets - widgets_shown);
		this.total_widgets = total_widgets;
		this.widgets_shown = widgets_shown;
	}

	get isPaging(): boolean { return this.widgets_shown < this.total_widgets; }
	get indexOf_followingPage(): number { return this.index + this.widgets_shown; }
	get maximum_paging_index(): number { return this.total_widgets - this.widgets_shown; }
	get thing(): Thing | null { return get(w_hierarchy).thing_forHID(this.thing_id.hash()) ?? null; }
	get predicate(): Predicate | null { return get(w_hierarchy).predicate_forKind(this.kind) ?? null; }
	get canShow(): number { return Math.round((get(w_ring_rotation_radius) ** 1.5) * Math.PI / 45 / k.height.row) + 1; }
	get sub_key(): string { return `${this.thing_id}${k.generic_separator}${this.kind}${k.generic_separator}${this.points_toChildren}`; }
	ancestry_atIndex(ancestries: Array<Ancestry>): Ancestry { return ancestries[Math.round(this.index)]; }

	index_isVisible(index: number): boolean {
		return index.isBetween(this.index, this.indexOf_followingPage - 1, true);
	}

	addTo_paging_index_for(delta: number): boolean {
		return (delta == 0) ? false : this.update_index_toShow(this.index + delta);
	}

	update_index_toShow(index: number): boolean {
		const prior = this.index;
		if (index == this.indexOf_followingPage) {
			this.index = (this.index + 1).force_between(0, this.maximum_paging_index);		// increment index by 1
		} else {
			this.index = index.force_between(0, this.maximum_paging_index);					// force == wrap around
		}
		const changed = this.index != prior;
		if (changed) {
			w_s_paging.set(this);
		}
		return changed;
	}

	onePage_from(ancestries: Array<Ancestry>): Array<Ancestry> {
		this.total_widgets = ancestries.length;
		this.widgets_shown = Math.min(this.canShow, this.total_widgets);
		this.update_index_toShow(this.index);
		const index = Math.round(this.index);
		return ancestries.slice(index, index + this.widgets_shown);
	}

	static create_s_paging_fromDict(dict: Dictionary, points_toChildren: boolean): S_Paging {
		const s_paging = new S_Paging(dict.index, dict.widgets_shown, dict.total_widgets);
		s_paging.points_toChildren = points_toChildren;
		s_paging.thing_id = dict.thing_id;
		s_paging.kind = dict.kind;
		return s_paging;
	}

	static create_s_paging_dict_fromDict(dict: Dictionary, points_toChildren: boolean): Dictionary<S_Paging> {
		const result: Dictionary<S_Paging> = {}
		for (const [key, subdict] of Object.entries(dict)) {
			result[key] = this.create_s_paging_fromDict(subdict, points_toChildren);
		}
		return result;
	}

}

export class S_Thing_Pages {

	parent_pagings_dict: Dictionary<S_Paging> = {};
	child_pagings_dict: Dictionary<S_Paging> = {};
	thing_id = k.empty;

	// every thing has an S_Thing_Pages
	//
	// two arrays of S_Paging (defined above)
	// 1) child: (to) children and relateds (more kinds later?)
	// 2) parent: (from) parents
	// each array has one index for each predicate kind
	// 
	// page == a subset of a too-long list
	// index == first of subset, and changes to show a different subset

	constructor(thing_id: string = k.empty) {
		this.thing_id = thing_id;
	}

	static create_fromDict(dict: Dictionary): S_Thing_Pages | null {
		const s_pages = new S_Thing_Pages(dict.thing_id);
		s_pages.child_pagings_dict = S_Paging.create_s_paging_dict_fromDict(dict.child_pagings_dict, true);
		s_pages.parent_pagings_dict = S_Paging.create_s_paging_dict_fromDict(dict.parent_pagings_dict, false);
		return s_pages;
	}

	get thing(): Thing | null { return get(w_hierarchy).thing_forHID(this.thing_id.hash()) ?? null; }
	s_paging_for(g_cluster: G_Cluster): S_Paging { return this.s_paging_forPredicate_toChildren(g_cluster.predicate, g_cluster.points_toChildren); }
	s_pagings_dict_forChildren(points_toChildren: boolean): Dictionary<S_Paging> { return points_toChildren ? this.child_pagings_dict : this.parent_pagings_dict; }

	add_s_paging(s_paging: S_Paging) {
		const s_pagings = this.s_pagings_dict_forChildren(s_paging.points_toChildren);
		s_pagings[s_paging.kind] = s_paging;
	}

	s_paging_forPredicate_toChildren(predicate: Predicate, points_toChildren: boolean): S_Paging {
		let s_pagings = this.s_pagings_dict_forChildren(points_toChildren);
		let s_paging = s_pagings[predicate.kind]
		if (!s_paging) {
			s_paging = new S_Paging();
			s_paging.kind = predicate.kind;
			s_paging.thing_id = this.thing_id;
			s_pagings[predicate.kind] = s_paging;
			s_paging.points_toChildren = points_toChildren;
		}
		return s_paging;
	}

}
