import { k, Thing, Predicate, Ancestry, G_Cluster } from '../common/Global_Imports';
import { s_hierarchy, s_s_paging, s_ring_rotation_radius } from './S_Stores';
import { get } from 'svelte/store';

export class S_Paging {

	// a page is a subset of a too-long list of things
	// widgets_shown == length of subset
	// index == first of subset

	points_toChildren = false;
	thing_id = k.empty;
	widgets_shown = 0;
	total_widgets = 0;
	kind = k.empty;
	index = 0;

	constructor(index: number = 0, widgets_shown: number = 0, total_widgets: number = 0) {
		this.index = index.force_between(0, total_widgets - widgets_shown);
		this.total_widgets = total_widgets;
		this.widgets_shown = widgets_shown;
	}

	static create_s_paging_from(description: string): S_Paging | null {
		let string = description.split(k.generic_separator);
		const [points_toChildren, kind, id, ...remaining] = string;
		if (remaining.length > 2) {
			const v: Array<number> = remaining.map(r => Number(r));
			const s_paging = new S_Paging(v[0], v[1], v[2]);
			s_paging.points_toChildren = points_toChildren == 'true';
			s_paging.thing_id = id;
			s_paging.kind = kind;
			return s_paging;
		}
		return null;
	}

	get stateIndex(): number { return this.predicate?.stateIndex ?? -1; }
	get isPaging(): boolean { return this.widgets_shown < this.total_widgets; }
	get indexOf_followingPage(): number { return this.index + this.widgets_shown; }
	get maximum_paging_index(): number { return this.total_widgets - this.widgets_shown; }
	get thing(): Thing | null { return get(s_hierarchy).thing_forHID(this.thing_id.hash()) ?? null; }
	get predicate(): Predicate | null { return get(s_hierarchy).predicate_forKind(this.kind) ?? null; }
	get canShow(): number { return Math.round((get(s_ring_rotation_radius) ** 1.5) * Math.PI / 45 / k.row_height) + 1; }
	get sub_key(): string { return `${this.thing_id}${k.generic_separator}${this.kind}${k.generic_separator}${this.points_toChildren}`; }

	get description(): string {
		const string = [
			`${this.points_toChildren}`,
			`${this.kind}`,
			`${this.thing_id}`,
			`${this.index}`,
			`${this.widgets_shown}`,
			`${this.total_widgets}`];
		return string.join(k.generic_separator);
	}

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
		return this.index != prior;
	}

	onePage_from(ancestries: Array<Ancestry>): Array<Ancestry> {
		this.total_widgets = ancestries.length;
		this.widgets_shown = Math.min(this.canShow, this.total_widgets);
		if (this.update_index_toShow(this.index)) {
			s_s_paging.set(this);
		}
		const index = Math.round(this.index);
		return ancestries.slice(index, index + this.widgets_shown);
	}

}

export class S_Pages {
	outward_s_pagings: Array<S_Paging> = [];
	inward_s_pagings: Array<S_Paging> = [];
	thing_id = k.empty;

	// two arrays of S_Paging (defined above)
	// 1) outward: (to) children and relateds (more kinds later?)
	// 2) inward: (from) parents
	// each array has one index for each predicate kind
	// 
	// page == a subset of a too-long list
	// index == first of subset

	constructor(thing_id: string = k.empty) {
		this.thing_id = thing_id;
	}

	get thing(): Thing | null { return get(s_hierarchy).thing_forHID(this.thing_id.hash()) ?? null; }
	get description(): string { return this.description_for(true) + k.big_separator + this.description_for(false); }
	s_paging_for(map: G_Cluster): S_Paging { return this.s_paging_forPointingTo(map.points_toChildren, map.predicate); }
	s_pagings_for(points_toChildren: boolean): Array<S_Paging> { return points_toChildren ? this.outward_s_pagings : this.inward_s_pagings; }

	add_s_paging(s_paging: S_Paging) {
		const s_pagings = this.s_pagings_for(s_paging.points_toChildren);
		s_pagings[s_paging.stateIndex] = s_paging;
	}

	description_for(points_toChildren: boolean): string {
		const s_pagings = this.s_pagings_for(points_toChildren);
		let separator, result = k.empty;
		for (const s_paging of s_pagings) {
			result = result + separator + s_paging.description;
			separator = k.small_separator;
		}
		return result;
	}

	s_paging_forPointingTo(points_toChildren: boolean, predicate: Predicate): S_Paging {
		let s_pagings = this.s_pagings_for(points_toChildren);
		const stateIndex = predicate.stateIndex;
		let s_paging = s_pagings[stateIndex]
		if (!s_paging) {
			s_paging = new S_Paging();
			s_paging.kind = predicate.kind;
			s_paging.points_toChildren = points_toChildren;
			s_paging.thing_id = this.thing_id;
			s_pagings[stateIndex] = s_paging;
		}
		return s_paging;
	}

}
