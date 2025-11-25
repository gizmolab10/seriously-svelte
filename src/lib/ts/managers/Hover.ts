import { Rect, Point, S_Hoverable, T_Hoverable } from '../common/Global_Imports';
import RBush from 'rbush';

type S_Hoverable_RBRect = {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	s_hoverable: S_Hoverable;
}

export default class UX_Hover {
	rbush = new RBush<S_Hoverable_RBRect>();
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

	s_hoverables_atPoint(point: Point): Array<S_Hoverable> {
		return this.rbush.search({
			minX: point.x,
			minY: point.y,
			maxX: point.x,
			maxY: point.y
		}).map(rbRect => rbRect.s_hoverable);
	}

	s_hoverables_inRect(rect: Rect): Array<S_Hoverable> {
		return this.rbush.search({
			minX: rect.x,
			minY: rect.y,
			maxX: rect.right,
			maxY: rect.bottom
		}).map(rbRect => rbRect.s_hoverable);
	}

	s_hoverables_inRect_ofType(rect: Rect, type: T_Hoverable): Array<S_Hoverable> {
		return this.s_hoverables_inRect(rect).filter(s_hoverable => s_hoverable.type === type);
	}

	s_hoverables_atPoint_ofType(point: Point | null, type: T_Hoverable): Array<S_Hoverable> {
		if (!!point) {
			return this.s_hoverables_atPoint(point).filter(s_hoverable => s_hoverable.type === type);
		}
		return [];
	}

}

export const hover = new UX_Hover();