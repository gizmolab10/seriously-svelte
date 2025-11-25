import { k, s, Rect, Point, hover, colors, layout, S_Widget, T_Hoverable } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

export default class S_Hoverable {
	containing_hoverable: S_Hoverable | null = null;	// only for drag and reveal dots
	identifiable: Identifiable | null = null;
	html_element: HTMLElement | null = null;			// for use in UX_Hover rbush index
	s_widget: S_Widget | null = null;					// only for drag and reveal dots
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	hoverColor = 'transparent';
	rect: Rect | null = null;							// for use in UX_Hover rbush index
	element_color = 'black';
	type: T_Hoverable;
	isADot = false;
	id: string;
	
	constructor(type: T_Hoverable, identifiable: Identifiable | null) {
		this.isADot = type === T_Hoverable.drag || type === T_Hoverable.reveal;
		this.id = type + '-' + (identifiable?.id ?? 'unknown identifiable');
		this.identifiable = identifiable;
		this.type = type;
	}

	get isHovering(): boolean { return this.isEqualTo(get(s.w_s_hover)); }
	get stroke(): string { return 'red'; }				// override in subclasses
	get svg_hover_color(): string { return this.isHovering ? colors.background : this.stroke; }

	isEqualTo(other: S_Hoverable | null): boolean { return !!other && this.id == other.id; }

	set isHovering(isHovering: boolean) {
		const old_hover = get(s.w_s_hover);
		const same = this.isEqualTo(old_hover);
		let new_hover = (!isHovering && this.isADot) ? this.s_widget : this;	// when leaving a dot, set to s_widget
		// if !same and isHovering, set to this, if same and !isHovering, set to null, otherwise leave it unchanged
		if (same != isHovering && new_hover != old_hover) {
			s.w_s_hover.set(new_hover as S_Hoverable);
		}
	}

	set_forHovering(element_color: string, hoverCursor: string) {
		this.hoverColor = colors.hover_special_blend(element_color);
		this.element_color = element_color;
		this.hoverCursor = hoverCursor;
	}

	set_html_element(html_element: HTMLElement | null) {
		if (!!html_element) {
			this.rect = layout.scaled_rect_forElement(html_element);
			this.html_element = html_element;
			hover.update_hoverable(this);
		}
	}

}