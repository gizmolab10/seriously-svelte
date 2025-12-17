import { g, k, hits, Rect, Point, debug, colors, Ancestry, S_Mouse, T_Hit_Target } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

export default class S_Hit_Target {

	// supports hit testing for all user-interactables in the DOM
	// S_Element, S_Widget, S_Component, S_Rotation, S_Resizing

    containedIn_rect?: (rect: Rect | null) => boolean;
    contains_point?: (point: Point | null) => boolean;
	doubleClick_callback?: (s_mouse: S_Mouse) => void;
	longClick_callback?: (s_mouse: S_Mouse) => void;
	handle_s_mouse?: (s_mouse: S_Mouse) => boolean;
	identifiable: Identifiable | null = null;
	html_element: HTMLElement | null = null;
	element_rect: Rect | null = null;							// for use in Hits index
	autorepeat_callback?: () => void;
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	detect_doubleClick?: boolean;
	detect_autorepeat?: boolean;
	detect_longClick?: boolean;
	hoverColor = 'transparent';
	element_color = 'black';
	autorepeat_id?: number;
	type: T_Hit_Target;
	clicks: number = 0;
	id: string;
	
	constructor(type: T_Hit_Target, identifiable: Identifiable | null) {
		this.id = type + '-' + (identifiable?.id ?? 'unknown identifiable');
		this.identifiable = identifiable;
		this.type = type;
	}

	static empty() { return {}; }
	get stroke(): string { return 'red'; }				// override in subclasses
	get rect(): Rect | null { return this.element_rect; }
	get ancestry(): Ancestry { return this.identifiable as Ancestry; }
	get isHovering(): boolean { return this.isEqualTo(get(hits.w_s_hover)); }
	set isHovering(isHovering: boolean) { hits.w_s_hover.set(isHovering ? this : null); }
	get svg_hover_color(): string { return this.isHovering ? colors.background : this.stroke; }
	get isADot(): boolean { return [T_Hit_Target.drag, T_Hit_Target.reveal].includes(this.type); }
	get isAWidget(): boolean { return [T_Hit_Target.widget, T_Hit_Target.title].includes(this.type); }
	get isAControl(): boolean { return [T_Hit_Target.control, T_Hit_Target.button, T_Hit_Target.glow].includes(this.type); }
	get isRing(): boolean { return [T_Hit_Target.rotation, T_Hit_Target.resizing, T_Hit_Target.paging].includes(this.type); }

	set rect(value: Rect | null) {
		this.element_rect = value;
		hits.add_hit_target(this);
	}

	isEqualTo(other: S_Hit_Target | null): boolean { return !!other && this.id == other.id; }

	set_forHovering(element_color: string, hoverCursor: string) {
		this.hoverColor = colors.hover_special_blend(element_color);
		this.element_color = element_color;
		this.hoverCursor = hoverCursor;
	}

	update_rect() {
		if (!!this.html_element) {
			let rect = g.scaled_rect_forElement(this.html_element);
			if (rect && (this.isADot || this.isAWidget || this.isRing)) {
				const graph_bounds = get(g.w_rect_ofGraphView);
				if (graph_bounds) {
					rect = rect.clippedTo(graph_bounds);
				}
			}
			this.rect = rect;
		}
	}

	set_html_element(html_element: HTMLElement | null) {
		if (!!html_element) {
			this.html_element = html_element;
			this.update_rect();
		} else {
			debug.log_hits(`no element for "${this.id}"`);
		}
	}

}
