import { Rect, Point, radial, controls } from '../common/Global_Imports';
import { T_Drag, T_Hit_Target } from '../common/Global_Imports';
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
	time_ofPrior_drag: number = 0;
	time_ofPrior_hover: number = 0;
	rbush = new RBush<Target_RBRect>();
	w_dragging = writable<T_Drag>(T_Drag.none);
	w_s_hover = writable<S_Hit_Target | null>(null);
	targets_dict_byID: { [id: string]: S_Hit_Target } = {};

	static readonly _____HOVER: unique symbol;

	get isHovering(): boolean { return get(this.w_s_hover) != null; }
	get hovering_type(): T_Hit_Target | null { return get(this.w_s_hover)?.type ?? null; }
	get isHovering_inWidget(): boolean { return !!this.hovering_type && [T_Hit_Target.widget, T_Hit_Target.drag, T_Hit_Target.reveal].includes(this.hovering_type); }
	get isHovering_inRing(): boolean { return !!this.hovering_type && [T_Hit_Target.rotation, T_Hit_Target.resizing, T_Hit_Target.paging].includes(this.hovering_type); }

	private detect_hovering_at(point: Point): boolean {
		const matches = this.targets_atPoint(point);
		const target = matches.find(s => s.isADot) 
			?? matches.find(s => s.type === T_Hit_Target.widget)
			?? matches[0];
		if (!!target) {
			target.isHovering = true;		// GOAL: set w_s_hover to target
		}
		return !!target;
	}

	static readonly _____GENERAL: unique symbol;

	handle_mouse_movement_at(point: Point) {
		const now = Date.now();
		if (!radial.isDragging && ((now - this.time_ofPrior_hover) >= 20)) {
			this.time_ofPrior_hover = now;
			if (get(this.w_dragging) === T_Drag.none) {
				if (!this.detect_hovering_at(point)) {
					this.w_s_hover.set(null);
				}
			}
			if (!this.isHovering || this.isHovering_inRing) {
				if (!radial.detect_hovering()) {
					this.w_s_hover.set(null);
				}
			}
		}
		if (controls.inRadialMode && ((now - this.time_ofPrior_drag) >= 40)) {
			this.time_ofPrior_drag = now;
			radial.handle_mouse_drag();
		}
	}

	reset() {
		this.rbush.clear();
		this.w_s_hover.set(null);
		this.targets_dict_byID = {};
		this.time_ofPrior_hover = 0;
	}

	recalibrate() {
		const newBush = new RBush<Target_RBRect>();
		const targets = Object.values(this.targets_dict_byID);
		for (const target of targets) {
			target.update_rect();
			if (!!target && !!target.rect) {
				newBush.insert({
					minX: target.rect.x,
					minY: target.rect.y,
					maxX: target.rect.right,
					maxY: target.rect.bottom,
					target: target
				});
			}
		}
		this.rbush = newBush;  // atomic swap
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

	update_hit_target(target: S_Hit_Target) {
		this.delete_hit_target(target);
		this.add_hit_target(target);
	}

	delete_hit_target(target: S_Hit_Target) {
		if (!!target && !!target.rect) {
			const id = target.id;
			if (!!id) {
				delete this.targets_dict_byID[id];
			}
			this.remove_from_rbush(target);
		}
	}

	static readonly _____INTERNALS: unique symbol;

	private add_hit_target(target: S_Hit_Target) {
		if (!!target && !!target.rect) {
			const id = target.id;
			if (!!id) {
				if (this.targets_dict_byID[id] == target) {
					return;	// already added, avoid duplicates
				}
				this.targets_dict_byID[id] = target;
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