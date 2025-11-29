import { T_Drag, T_Hit_Target } from '../common/Global_Imports';
import { Rect, Point, radial } from '../common/Global_Imports';
import { S_Hit_Target } from '../common/Global_Imports';
import { get, writable } from 'svelte/store';
import RBush from 'rbush';

type HIT_RBRect = {
	minX: number;
	minY: number;
	maxX: number;	
	maxY: number;	
	hit: S_Hit_Target;
}

export default class Hits {
	time_ofPrior_hover: number = 0;
	rbush = new RBush<HIT_RBRect>();
	current_hits = new Set<S_Hit_Target>();
	location_ofPrior_hover: Point | null = null;
	hits_byID: { [id: string]: S_Hit_Target } = {};
	w_s_hover = writable<S_Hit_Target | null>(null);
	w_dragging_active = writable<T_Drag>(T_Drag.none);

	static readonly _____HOVER: unique symbol;

	handle_hover_at(point: Point) {
		const now = Date.now();
		const waited_long_enough = (now - this.time_ofPrior_hover) >= 10;
		const isBusy = radial.isAny_rotation_active || get(this.w_dragging_active) !== T_Drag.none;
		const traveled_far_enough = (this.location_ofPrior_hover?.vector_to(point).magnitude ?? Infinity) >= 10;
		if (!isBusy && waited_long_enough && traveled_far_enough) {
			this.location_ofPrior_hover = point;
			this.time_ofPrior_hover = now;
			const matches = this.hits_atPoint(point);
			const target = matches.find(s => s.isADot) 
				?? matches.find(s => s.type === T_Hit_Target.widget)
				?? matches[0];
			if (target) {
				target.isHovering = true;	// sets w_s_hover to target
			}
		}
	}

	static readonly _____HIT_TEST: unique symbol;

	hits_atPoint_ofType(point: Point | null, type: T_Hit_Target): Array<S_Hit_Target> {
		return !point ? [] : this.hits_atPoint(point).filter(hit => hit.type === type);
	}

	hits_atPoint(point: Point): Array<S_Hit_Target> {
		return this.rbush.search({
			minX: point.x,
			minY: point.y,
			maxX: point.x,
			maxY: point.y
		}).map(rbRect => rbRect.hit);
	}

	hits_inRect(rect: Rect): Array<S_Hit_Target> {
		return this.rbush.search({
			minX: rect.x,
			minY: rect.y,
			maxX: rect.right,
			maxY: rect.bottom
		}).map(rbRect => rbRect.hit);
	}

	static readonly _____ADD_AND_REMOVE: unique symbol;

	update_hit(hit: S_Hit_Target) {
		this.remove_hit(hit);
		this.add_hit(hit);
	}

	private add_hit(hit: S_Hit_Target) {
		if (!!hit && !!hit.rect) {
			const id = hit.id;
			if (!!id) {
				if (this.hits_byID[id] == hit) {
					return;	// already added, avoid duplicates
				}
				this.hits_byID[id] = hit;
			}
			this.rbush.insert({
				minX: hit.rect.x,
				minY: hit.rect.y,
				maxX: hit.rect.right,
				maxY: hit.rect.bottom,
				hit: hit
			});
		}
	}

	remove_hit(hit: S_Hit_Target) {
		if (!!hit && !!hit.rect) {
			const id = hit.id;
			if (!!id) {
				delete this.hits_byID[id];
			}
			this.rbush.remove({
				minX: hit.rect.x,
				minY: hit.rect.y,
				maxX: hit.rect.right,
				maxY: hit.rect.bottom,
				hit: hit
			}, (a, b) => a.hit === b.hit);
		}
	}

}

export const hits = new Hits();