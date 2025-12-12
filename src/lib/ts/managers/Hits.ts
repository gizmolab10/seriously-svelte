import { g, k, s, Rect, Point, debug, g_radial, radial, controls } from '../common/Global_Imports';
import { T_Drag, T_Hit_Target, T_Radial_Zone, T_Cluster_Pager } from '../common/Global_Imports';
import { S_Hit_Target } from '../common/Global_Imports';
import type { Dictionary } from '../types/Types';
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
	w_dragging = writable<T_Drag>(T_Drag.none);
	rbush_forHover = new RBush<Target_RBRect>();
	w_s_hover = writable<S_Hit_Target | null>(null);
	targets_dict_byID: { [id: string]: S_Hit_Target } = {};
	targets_dict_byType: Dictionary<Array<S_Hit_Target>> = {};

	static readonly _____HOVER: unique symbol;

	get isHovering(): boolean { return get(this.w_s_hover) != null; }
	get paging_types(): Array<T_Hit_Target> { return [T_Hit_Target.paging]; }
	get hovering_type(): T_Hit_Target | null { return get(this.w_s_hover)?.type ?? null; }
	get ring_types(): Array<T_Hit_Target> { return [T_Hit_Target.rotation, T_Hit_Target.resizing]; }
	get rbush_forRubberband(): RBush<Target_RBRect> { return this.rbush_forTypes(this.rubberband_types); }
	get isHovering_inRing(): boolean { return !!this.hovering_type && this.ring_types.includes(this.hovering_type); }
	get isHovering_inPaging(): boolean { return !!this.hovering_type && this.paging_types.includes(this.hovering_type); }
	get isHovering_inWidget(): boolean { return !!this.hovering_type && this.rubberband_types.includes(this.hovering_type); }
	get rubberband_types(): Array<T_Hit_Target> { return [T_Hit_Target.widget, T_Hit_Target.drag, T_Hit_Target.reveal, T_Hit_Target.title]; }

	private detect_hovering_at(point: Point) {
		const matches = this.targets_atPoint(point);	// # should always be small (verify?)
		if (matches.length > 2) {
			this.debug(null, `EXCESSIVE matches ${matches.map(s => s.id).join(', ')}`);
		}
		const target
			=  matches.find(s => s.isADot)
			?? matches.find(s => s.isAWidget)
			?? matches.find(s => s.isRing)
			?? matches[0];
		this.w_s_hover.set(!target ? null : target);
		return !!target;
	}

	static readonly _____GENERAL: unique symbol;

	handle_mouse_movement_at(point: Point) {
		const now = Date.now();
		if (!radial.isDragging && ((now - this.time_ofPrior_hover) >= 20)) {
			this.time_ofPrior_hover = now;
			if (get(this.w_dragging) === T_Drag.none) {
				this.detect_hovering_at(point)
			}
		}
		if (controls.inRadialMode && ((now - this.time_ofPrior_drag) >= 100)) {
			this.time_ofPrior_drag = now;
			radial.handle_mouse_drag();
		}
	}

	reset() {
		this.rbush_forHover.clear();
		this.w_s_hover.set(null);
		this.time_ofPrior_hover = 0;
		this.targets_dict_byID = {};
		this.targets_dict_byType = {};
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
		this.rbush_forHover = newBush;  // atomic swap
	}

	static readonly _____HIT_TEST: unique symbol;

	targets_ofType_atPoint(type: T_Hit_Target, point: Point | null): Array<S_Hit_Target> {
		return !point ? [] : this.targets_atPoint(point).filter(target => target.type == type);
	}

	targets_atPoint(point: Point): Array<S_Hit_Target> {
		const targets = this.rbush_forHover.search(point.asBBox).map(rbRect => rbRect.target);
		return targets.filter(target => (target.contains_point?.(point) ?? true));	// refine using shape of target
	}

	targets_inRect(rect: Rect): Array<S_Hit_Target> {
		const targets = this.rbush_forHover.search(rect.asBBox).map(rbRect => rbRect.target);
		return targets.filter(target => (target.containedIn_rect?.(rect) ?? true));	// refine using shape of target
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
			const type = target.type;
			const byType = this.targets_dict_byType[type];
			if (byType) {
				const index = byType.indexOf(target);
				if (index !== -1) {
					byType.splice(index, 1);
				}
			}
			this.remove_from_rbush(target);
			// this.debug(target, `DELETE for id: ${target.id}`);
		}
	}

	static readonly _____INTERNALS: unique symbol;

	get targets(): Array<S_Hit_Target> { return this.rbush_forHover.all().map(rbRect => rbRect.target); }

	private insert_into_rbush(target: S_Hit_Target) {
		if (!!target && !!target.rect) {
			this.rbush_forHover.insert({
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
			this.rbush_forHover.remove({
				minX: target.rect.x,
				minY: target.rect.y,
				maxX: target.rect.right,
				maxY: target.rect.bottom,
				target: target
			}, (a, b) => a.target === b.target);
		}
	}

	private add_hit_target(target: S_Hit_Target) {
		const id = target.id;
		const type = target.type;
		if (!id || !type || !target.rect || this.targets_dict_byID[id] == target) {
			this.debug(target, `IGNORE: ${target.toString()}`);
		} else {
			if (!this.targets_dict_byType[type]) {
				this.targets_dict_byType[type] = [];
			} else if (!this.allow_multiple_targets_forType(type)) {
				const existing = this.targets_dict_byType[type].find(t => t.id == id);
				if (!!existing) {
					this.delete_hit_target(existing);
				}
			}
			this.targets_dict_byID[id]  = target;
			this.targets_dict_byType[type].push(target);
			this.insert_into_rbush(target);
			this.debug(target, `ADDED  for id: ${target.id}`);
		}
	}

	private targets_forTypes(types: Array<T_Hit_Target>): Array<S_Hit_Target> {
		const targets: Array<S_Hit_Target> = [];
		for (const type of types) {
			const byType = this.targets_dict_byType[type];
			if (!!byType && byType.length > 0) {
				targets.push(...byType);
			}
		}
		return targets;
	}

	private rbush_forTypes(types: Array<T_Hit_Target>): RBush<Target_RBRect> {
		const targets = this.targets_forTypes(types);
		const bush = new RBush<Target_RBRect>();
		for (const target of targets) {
			if (!!target && !!target.rect) {
				const rect = target.rect;
				bush.insert({
					minX: rect.x,
					minY: rect.y,
					maxX: rect.right,
					maxY: rect.bottom,
					target: target
				});
			}
		}
		return bush;
	}

	private allow_multiple_targets_forType(type: T_Hit_Target): boolean {
		return [
			T_Hit_Target.control,
			T_Hit_Target.details,
			T_Hit_Target.action,
			T_Hit_Target.button,
			T_Hit_Target.cancel,
			T_Hit_Target.paging,
			T_Hit_Target.reveal,
			T_Hit_Target.search,
			T_Hit_Target.widget,
			T_Hit_Target.title,
			T_Hit_Target.drag,
			T_Hit_Target.line].includes(type);
	}

	static readonly _____DEBUG: unique symbol;

	get info(): string { return `${this.targets.length}`; }

	debug(target: S_Hit_Target | null, message: string, ...args: any[]) {
		if (!target || (target.isAWidget && target.id == 'widget-cra')) {
			debug.log_hits(this.info, message, ...args);
		}
	}

}

export const hits = new Hits();