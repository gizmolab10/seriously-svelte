import { Rect, Point, debug, S_Detectable, T_Detectable } from '../common/Global_Imports';
import RBush from 'rbush';

type HIT_RBRect = {
	minX: number;
	minY: number;
	maxX: number;	
	maxY: number;	
	hit: S_Detectable;
}

export default class Hits {
	rbush = new RBush<HIT_RBRect>();
	current_hits = new Set<S_Detectable>();
	hits_byID: { [id: string]: S_Detectable } = {};

	static readonly _____HIT_TEST: unique symbol;

	// adjusts isHovering for all hits,
	// (isHovering sets s.w_s_hover to the last hit where isHovering is true

	update_hover_at(point: Point) {
		const hits = this.hits_atPoint(point);
		const dots = hits.filter(s => s.isADot);
		const widgets = hits.filter(s => s.type === T_Detectable.widget);
		// debug.log_hits(`${hits.map(hit => hit.id).join(', ')}`);
		if (dots.length > 0) {
			dots[0].isHovering = true;
		} else if (widgets.length > 0) {
			widgets[0].isHovering = true;
		}
	}

	hits_inRect_ofType(rect: Rect, type: T_Detectable): Array<S_Detectable> {
		return this.hits_inRect(rect).filter(hit => hit.type === type);
	}

	hits_atPoint_ofType(point: Point | null, type: T_Detectable): Array<S_Detectable> {
		return !point ? [] : this.hits_atPoint(point).filter(hit => hit.type === type);
	}

	hits_atPoint(point: Point): Array<S_Detectable> {
		return this.rbush.search({
			minX: point.x,
			minY: point.y,
			maxX: point.x,
			maxY: point.y
		}).map(rbRect => rbRect.hit);
	}

	hits_inRect(rect: Rect): Array<S_Detectable> {
		return this.rbush.search({
			minX: rect.x,
			minY: rect.y,
			maxX: rect.right,
			maxY: rect.bottom
		}).map(rbRect => rbRect.hit);
	}

	static readonly _____ADD_AND_REMOVE: unique symbol;

	update_hit(hit: S_Detectable) {
		this.remove_hit(hit);
		this.add_hit(hit);
	}

	private add_hit(hit: S_Detectable) {
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

	remove_hit(hit: S_Detectable) {
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