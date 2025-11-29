import { T_Drag, T_Hit_Target } from '../common/Global_Imports';
import { Rect, Point, radial } from '../common/Global_Imports';
import { S_Hit_Target } from '../common/Global_Imports';
import { get, writable } from 'svelte/store';
import RBush from 'rbush';

type Target_RBRect = {
	minX: number;
	minY: number;
	maxX: number;	
	maxY: number;	
	target: S_Hit_Target;
}

export default class Hits {
	time_ofPrior_hover: number = 0;
	rbush = new RBush<Target_RBRect>();
	location_ofPrior_hover: Point | null = null;
	w_s_hover = writable<S_Hit_Target | null>(null);
	w_dragging_active = writable<T_Drag>(T_Drag.none);
	targets_byID: { [id: string]: S_Hit_Target } = {};

	reset() {
		this.rbush.clear();
		this.targets_byID = {};
		this.w_s_hover.set(null);
		this.time_ofPrior_hover = 0;
		this.location_ofPrior_hover = null;
	}

	recalibrate() {
		this.rbush.clear();
		const targets = Object.values(this.targets_byID);
		for (const target of targets) {
			target.update_rect();
			this.insert_into_rbush(target);
		}
	}

	static readonly _____HOVER: unique symbol;

	handle_hover_at(point: Point) {
		const now = Date.now();
		const waited_long_enough = (now - this.time_ofPrior_hover) >= 10;
		const isBusy = radial.isAny_rotation_active || get(this.w_dragging_active) !== T_Drag.none;
		const traveled_far_enough = (this.location_ofPrior_hover?.vector_to(point).magnitude ?? Infinity) >= 10;
		if (!isBusy && waited_long_enough && traveled_far_enough) {
			const matches = this.targets_atPoint(point);
			const target = matches.find(s => s.isADot) 
				?? matches.find(s => s.type === T_Hit_Target.widget)
				?? matches[0];
			if (!target) {
				this.w_s_hover.set(null);
			} else {
				target.isHovering = true;	// sets w_s_hover to target
				this.time_ofPrior_hover = now;
				this.location_ofPrior_hover = point;
			}
		}
	}

	static readonly _____HIT_TEST: unique symbol;

	targets_ofType_atPoint(type: T_Hit_Target, point: Point | null): Array<S_Hit_Target> {
		return !point ? [] : this.targets_atPoint(point).filter(target => target.type === type);
	}

	targets_atPoint(point: Point): Array<S_Hit_Target> {
		return this.rbush.search({
			minX: point.x,
			minY: point.y,
			maxX: point.x,
			maxY: point.y
		}).map(rbRect => rbRect.target);
	}

	targets_inRect(rect: Rect): Array<S_Hit_Target> {
		return this.rbush.search({
			minX: rect.x,
			minY: rect.y,
			maxX: rect.right,
			maxY: rect.bottom
		}).map(rbRect => rbRect.target);
	}

	static readonly _____ADD_AND_REMOVE: unique symbol;

	update_target(target: S_Hit_Target) {
		this.delete_target(target);
		this.add_target(target);
	}

	delete_target(target: S_Hit_Target) {
		if (!!target && !!target.rect) {
			const id = target.id;
			if (!!id) {
				delete this.targets_byID[id];
			}
			this.remove_from_rbush(target);
		}
	}

	static readonly _____INTERNALS: unique symbol;

	private add_target(target: S_Hit_Target) {
		if (!!target && !!target.rect) {
			const id = target.id;
			if (!!id) {
				if (this.targets_byID[id] == target) {
					return;	// already added, avoid duplicates
				}
				this.targets_byID[id] = target;
			}
			this.insert_into_rbush(target);
		}
	}

	private insert_into_rbush(target: S_Hit_Target) {
		if (!!target && !!target.rect) {
			this.rbush.insert({
				minX: target.rect.x,
				minY: target.rect.y,
				maxX: target.rect.right,
				maxY: target.rect.bottom,
				target: target
			});
		}
	}

	private remove_from_rbush(target: S_Hit_Target) {
		if (!!target && !!target.rect) {
			this.rbush.remove({
				minX: target.rect.x,
				minY: target.rect.y,
				maxX: target.rect.right,
				maxY: target.rect.bottom,
				target: target
			}, (a, b) => a.target === b.target);
		}
	}

}

export const hits = new Hits();