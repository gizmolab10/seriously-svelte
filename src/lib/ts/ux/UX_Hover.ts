import { Rect, Point, S_Hoverable } from '../common/Global_Imports';
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
	s_hoverables_byElement_ID: { [element_ID: string]: S_Hoverable } = {};

	static readonly _____HOVER_DETECTION: unique symbol;

	detect_hover_at(point: Point, event: MouseEvent | null = null) {
		const s_hoverables_set = new Set(this.s_hoverables_atPoint(point));
		for (const s_hoverable of this.current_s_hoverables) {
			if (!s_hoverables_set.has(s_hoverable)) {
				s_hoverable.isHovering = false;
			}
		}
		this.current_s_hoverables = s_hoverables_set;
	}

	update_hoverable(s_hoverable: S_Hoverable) {
		this.remove_hoverable(s_hoverable);
		this.add_hoverable(s_hoverable);
	}

	add_hoverable(s_hoverable: S_Hoverable) {
		if (!!s_hoverable && !!s_hoverable.rect) {
			if (!!s_hoverable.html_element) {
				this.s_hoverables_byElement_ID[s_hoverable.html_element.id] = s_hoverable;
			}
			this.rbush.insert({
				minX: s_hoverable.rect.x,
				minY: s_hoverable.rect.y,
				maxX: s_hoverable.rect.right,
				maxY: s_hoverable.rect.bottom,
				s_hoverable: s_hoverable
			});
		}
	}

	remove_hoverable(s_hoverable: S_Hoverable) {
		if (!!s_hoverable && !!s_hoverable.rect) {
			if (!!s_hoverable.html_element) {
				delete this.s_hoverables_byElement_ID[s_hoverable.html_element.id];
			}
			this.rbush.remove({
				minX: s_hoverable.rect.x,
				minY: s_hoverable.rect.y,
				maxX: s_hoverable.rect.right,
				maxY: s_hoverable.rect.bottom,
				s_hoverable: s_hoverable
			}, (a, b) => a.s_hoverable === b.s_hoverable);
		}
	}

	s_hoverables_atPoint(point: Point): S_Hoverable[] {
		return this.rbush.search({
			minX: point.x,
			minY: point.y,
			maxX: point.x,
			maxY: point.y
		}).map(item => item.s_hoverable);
	}

	s_hoverables_inRect(rect: Rect): S_Hoverable[] {
		return this.rbush.search({
			minX: rect.x,
			minY: rect.y,
			maxX: rect.right,
			maxY: rect.bottom
		}).map(item => item.s_hoverable);
	}

}

export const hover = new UX_Hover();