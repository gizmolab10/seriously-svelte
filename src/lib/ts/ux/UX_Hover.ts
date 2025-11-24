import { Rect, Point, debug, S_Hoverable } from '../common/Global_Imports';
import RBush from 'rbush';

type S_Hoverable_RBBox = {
	s_hoverable: S_Hoverable;
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export default class UX_Hover {
	rbush = new RBush<S_Hoverable_RBBox>();
	current_s_hoverables = new Set<S_Hoverable>();

	static readonly _____HOVER_DETECTION: unique symbol;

	detect_hover_at(point: Point, event: MouseEvent | null = null) {
		// Query rbush for hoverables at mouse position - O(log n)
		const s_hoverables_at_point = this.s_hoverables_atPoint(point.x, point.y);
		const s_hoverables_set = new Set(s_hoverables_at_point);

		// Find hoverables that lost hover (leave)
		for (const s_hoverable of this.current_s_hoverables) {
			if (!s_hoverables_set.has(s_hoverable)) {
				s_hoverable.isHovering = false;
			}
		}
		this.current_s_hoverables = s_hoverables_set;
	}

	index_hoverable(s_hoverable: S_Hoverable) {
		if (!!s_hoverable && !!s_hoverable.rect) {
			this.rbush.insert({
				minX: s_hoverable.rect.x,
				minY: s_hoverable.rect.y,
				maxX: s_hoverable.rect.right,
				maxY: s_hoverable.rect.bottom,
				s_hoverable: s_hoverable
			});
		}
	}

	update_hoverable(s_hoverable: S_Hoverable) {
		if (!!s_hoverable && !!s_hoverable.rect) {
			this.remove_hoverable(s_hoverable);
			this.index_hoverable(s_hoverable);
		}
	}

	remove_hoverable(s_hoverable: S_Hoverable) {
		if (!!s_hoverable && !!s_hoverable.rect) {
			this.rbush.remove({
				minX: s_hoverable.rect.x,
				minY: s_hoverable.rect.y,
				maxX: s_hoverable.rect.right,
				maxY: s_hoverable.rect.bottom,
				s_hoverable: s_hoverable
			}, (a, b) => a.s_hoverable === b.s_hoverable);
		}
	}

	s_hoverables_atPoint(x: number, y: number): S_Hoverable[] {
		const results = this.rbush.search({
			minX: x,
			minY: y,
			maxX: x,
			maxY: y
		});
		return results.map(item => item.s_hoverable);
	}

	s_hoverables_inRect(rect: Rect): S_Hoverable[] {
		const results = this.rbush.search({
			minX: rect.x,
			minY: rect.y,
			maxX: rect.right,
			maxY: rect.bottom
		});
		return results.map(item => item.s_hoverable as S_Hoverable);
	}

}

export const hover = new UX_Hover();