import { k, s, Rect, hover, colors, S_Widget, T_Hoverable } from '../common/Global_Imports';
import { get } from 'svelte/store';

export default class S_Hoverable {
	containing_hoverable: S_Hoverable | null = null;	// only for drag and reveal dots
	html_element: HTMLElement | null = null;			// for use in UX_Hover rbush index
	s_widget: S_Widget | null = null;					// only for drag and reveal dots
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	hoverColor = 'transparent';
	rect: Rect | null = null;							// for use in UX_Hover rbush index
	// type = T_Hoverable.none;
	element_color = 'black';							// override in subclasses
	isADot = false;										// override in subclasses
	id = k.empty;										// override in subclasses

	get stroke(): string { return 'red'; }				// override in subclasses
	get isHovering(): boolean { return get(s.w_s_hover) == this; }
	get svg_hover_color(): string { return this.isHovering ? colors.background : this.stroke; }

	set isHovering(isHovering: boolean) {
		const old_hover = get(s.w_s_hover);
		const same = old_hover == this;
		let new_hover = (!isHovering && this.isADot) ? this.s_widget : this;	// when leaving a dot, set to s_widget
		// if !same and isHovering, set to this, if same and !isHovering, set to null, otherwise leave it unchanged
		if (same != isHovering && new_hover != old_hover) {
			s.w_s_hover.set(new_hover as S_Hoverable);
		}
	}

	set_rect(rect: Rect) {
		this.rect = rect;
		this.update_hoverable();
	}

	set_html_element(html_element: HTMLElement) {
		this.html_element = html_element;
		this.update_hoverable();
	}

	set_forHovering(element_color: string, hoverCursor: string) {
		this.hoverColor = colors.hover_special_blend(element_color);
		this.element_color = element_color;
		this.hoverCursor = hoverCursor;
	}

	update_hoverable() {
		if (!!this.html_element && !!this.rect) {
			hover.update_hoverable(this);
		}
	}

}