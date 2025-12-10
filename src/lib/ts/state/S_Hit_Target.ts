import { g, k, hits, Rect, Point, debug, colors, Ancestry, T_Hit_Target } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

export default class S_Hit_Target {

	// supports hit testing for all user-interactables in the DOM
	// S_Element, S_Widget, S_Component, S_Rotation, S_Resizing

    containedIn_rect?: (rect: Rect | null) => boolean;
    contains_point?: (point: Point | null) => boolean;
	identifiable: Identifiable | null = null;
	html_element: HTMLElement | null = null;
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	hoverColor = 'transparent';
	rect: Rect | null = null;							// for use in Hits index
	element_color = 'black';
	type: T_Hit_Target;
	id: string;
	
	constructor(type: T_Hit_Target, identifiable: Identifiable | null) {
		this.id = type + '-' + (identifiable?.id ?? 'unknown identifiable');
		this.identifiable = identifiable;
		this.type = type;
	}

	static empty() { return {}; }
	get stroke(): string { return 'red'; }				// override in subclasses
	get ancestry(): Ancestry { return this.identifiable as Ancestry; }
	get isAWidget(): boolean { return this.type === T_Hit_Target.widget; }
	get isHovering(): boolean { return this.isEqualTo(get(hits.w_s_hover)); }
	set isHovering(isHovering: boolean) { hits.w_s_hover.set(isHovering ? this : null); }
	get svg_hover_color(): string { return this.isHovering ? colors.background : this.stroke; }
	get isADot(): boolean { return [T_Hit_Target.drag, T_Hit_Target.reveal].includes(this.type); }
	get isARing(): boolean { return [T_Hit_Target.rotation, T_Hit_Target.resizing, T_Hit_Target.paging].includes(this.type); }

	isEqualTo(other: S_Hit_Target | null): boolean { return !!other && this.id == other.id; }

	set_forHovering(element_color: string, hoverCursor: string) {
		this.hoverColor = colors.hover_special_blend(element_color);
		this.element_color = element_color;
		this.hoverCursor = hoverCursor;
	}

	update_rect() {
		if (!!this.html_element) {
			this.rect = g.scaled_rect_forElement(this.html_element);
		}
	}

	set_html_element(html_element: HTMLElement | null) {
		if (!!html_element) {
			this.html_element = html_element;
			this.update_rect();
			hits.update_hit_target(this);
		} else {
			debug.log_hits(`no element for "${this.id}"`);
		}
	}

}