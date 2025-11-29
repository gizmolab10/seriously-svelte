import { k, hits, Rect, colors, layout, T_Hit_Target } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

export default class S_Detectable {
	containing_detectable: S_Detectable | null = null;	// only for drag and reveal dots
	identifiable: Identifiable | null = null;
	html_element: HTMLElement | null = null;
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	hoverColor = 'transparent';
	rect: Rect | null = null;							// for use in Hits index
	element_color = 'black';
	type: T_Hit_Target;
	isADot = false;
	id: string;
	
	constructor(type: T_Hit_Target, identifiable: Identifiable | null) {
		this.isADot = type === T_Hit_Target.drag || type === T_Hit_Target.reveal;
		this.id = type + '-' + (identifiable?.id ?? 'unknown identifiable');
		this.identifiable = identifiable;
		this.type = type;
	}

	get isHovering(): boolean { return this.isEqualTo(get(hits.w_s_hover)); }
	get stroke(): string { return 'red'; }				// override in subclasses
	get svg_hover_color(): string { return this.isHovering ? colors.background : this.stroke; }
	set isHovering(isHovering: boolean) { hits.w_s_hover.set(isHovering ? this : null); }

	isEqualTo(other: S_Detectable | null): boolean { return !!other && this.id == other.id; }

	set_forHovering(element_color: string, hoverCursor: string) {
		this.hoverColor = colors.hover_special_blend(element_color);
		this.element_color = element_color;
		this.hoverCursor = hoverCursor;
	}

	set_html_element(html_element: HTMLElement | null) {
		if (!!html_element) {
			this.rect = layout.scaled_rect_forElement(html_element);
			this.html_element = html_element;
			hits.update_hit(this);
		}
	}

}