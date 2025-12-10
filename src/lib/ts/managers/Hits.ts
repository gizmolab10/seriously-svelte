import { g, k, s, Rect, Point, debug, g_radial, radial, controls } from '../common/Global_Imports';
import { T_Drag, T_Hit_Target, T_Radial_Zone, T_Cluster_Pager } from '../common/Global_Imports';
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
	get isHovering_inPaging(): boolean { return !!this.hovering_type && [T_Hit_Target.paging].includes(this.hovering_type); }
	get isHovering_inRing(): boolean { return !!this.hovering_type && [T_Hit_Target.rotation, T_Hit_Target.resizing].includes(this.hovering_type); }
	get isHovering_inWidget(): boolean { return !!this.hovering_type && [T_Hit_Target.widget, T_Hit_Target.drag, T_Hit_Target.reveal].includes(this.hovering_type); }

	private detect_hovering_at(point: Point) {
		const matches = this.targets_atPoint(point);	// # should always be small (verify?)
		if (matches.length > 2) {
			this.debug(null, `EXCESSIVE matches ${matches.map(s => s.id).join(', ')}`);
		}
		const target
			=  matches.find(s => s.isADot)
			?? matches.find(s => s.isAWidget)
			?? matches.find(s => s.isARing)
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
		return !point ? [] : this.targets_atPoint(point).filter(target => target.type == type);
	}

	targets_atPoint(point: Point): Array<S_Hit_Target> {
		const targets = this.rbush.search(point.asBBox).map(rbRect => rbRect.target);
		return targets.filter(target => (target.contains_point?.(point) ?? true));	// refine using shape of target
	}

	targets_inRect(rect: Rect): Array<S_Hit_Target> {
		const targets = this.rbush.search(rect.asBBox).map(rbRect => rbRect.target);
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
			this.remove_from_rbush(target);
			// this.debug(target, `DELETE for id: ${target.id}`);
		}
	}

	static readonly _____INTERNALS: unique symbol;

	debug(target: S_Hit_Target | null, message: string, ...args: any[]) {
		if (!target || (target.isAWidget && target.id == 'widget-cra')) {
			debug.log_hits(message, ...args);
		}
	}

	private add_hit_target(target: S_Hit_Target) {
		const id = target.id;
		if (!!id && !!target.rect) {
			if (this.targets_dict_byID[id] != target) {
				this.targets_dict_byID[id]  = target;
				this.insert_into_rbush(target);
				this.debug(target, `ADDED  for id: ${target.id}`);
				return;
			}
		}
		this.debug(target, `IGNORE: ${target.toString()}`);
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

	static readonly _____RADIAL: unique symbol;

	ring_zone_atScaled(scaled: Point): T_Radial_Zone {
		const mouse_vector = g.vector_fromScaled_mouseLocation_andOffset_fromGraphCenter(scaled);
		if (!!mouse_vector) {
			return this.ring_zone_atVector_relativeToGraphCenter(mouse_vector);
		}
		return T_Radial_Zone.miss;
	}

	get ring_zone_atMouseLocation(): T_Radial_Zone {
		const mouse_vector = g.mouse_vector_ofOffset_fromGraphCenter();
		if (!!mouse_vector) {
			return this.ring_zone_atVector_relativeToGraphCenter(mouse_vector);
		}
		return T_Radial_Zone.miss;
	}

	ring_zone_atVector_relativeToGraphCenter(mouse_vector: Point): T_Radial_Zone {
		let ring_zone = T_Radial_Zone.miss;
		const hover_type = get(hits.w_s_hover)?.type;
		const hasHovering_conflict = !!hover_type && [T_Hit_Target.widget, T_Hit_Target.drag].includes(hover_type);
		if (!!mouse_vector && !hasHovering_conflict) {
			const show_cluster_sliders = get(s.w_t_cluster_pager) == T_Cluster_Pager.sliders;
			const g_cluster = g_radial.g_cluster_atMouseLocation;
			const inner = get(radial.w_resize_radius);
			const distance = mouse_vector.magnitude;
			const thick = k.thickness.radial.ring;
			const thin = k.thickness.radial.arc;
			const outer = inner + thick;
			const thumb = inner + thin;
			if (!!distance) {
				if (distance < inner) {
					ring_zone = T_Radial_Zone.resize;
				} else if (distance < thumb && show_cluster_sliders && !!g_cluster && g_cluster.isMouse_insideThumb) {
					ring_zone = T_Radial_Zone.paging;
				} else if (distance <= outer) {
					ring_zone = T_Radial_Zone.rotate;
				}
			}
			debug.log_mouse(` ring zone ${ring_zone} ${distance.asInt()}`);
			debug.log_cursor(` ring zone ${ring_zone} ${mouse_vector.verbose}`);
		}
		return ring_zone;
	}

}

export const hits = new Hits();