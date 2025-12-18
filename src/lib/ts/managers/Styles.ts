
import { k, colors, S_Color, controls } from '../common/Global_Imports';

	//////////////////////////////////////////
	//										//
	//	Color computation functions			//
	//	Centralized logic for computing		//
	//	colors based on component state		//
	//										//
	//////////////////////////////////////////

export default class Styles {

	get_widgetColors_for(state: S_Color, thing_color: string, background_color: string): { color: string; background_color: string; border: string } {
		const isLight = colors.luminance_ofColor(thing_color) > 0.5;
		const has_thing_color = thing_color !== k.empty;

		// Compute color (text/stroke)
		let color: string;
		if (state.grabbed && !state.editing) {
			color = isLight ? 'black' : 'white';
		} else if (state.editing) {
			color = isLight ? 'black' : thing_color;
		} else {
			color = thing_color;
		}

		// Compute background_color
		let bg_color: string;
		if (state.grabbed && !state.editing) {
			bg_color = thing_color;
		} else if (state.hover || state.editing || (state.focus && controls.inRadialMode)) {
			bg_color = background_color;
		} else {
			bg_color = 'transparent';
		}

		// Compute border
		let border: string;
		if (has_thing_color && state.editing) {
			border = `dashed ${thing_color} 1px`;
		} else if (has_thing_color && state.focus && controls.inRadialMode && !state.grabbed) {
			border = `solid ${thing_color} 1px`;
		} else if (has_thing_color && state.hover) {
			border = `solid ${colors.ofBackgroundFor(thing_color)} 1px`;
		} else {
			border = 'solid transparent 1px';
		}

		return { color, background_color: bg_color, border };
	}

	get_dotColors_for(state: S_Color, element_color: string, thing_color: string, background_color: string, hoverColor: string): { fill: string; stroke: string; svg_outline_color: string } {
		const isLight = colors.luminance_ofColor(thing_color) > 0.5;
		const color_isInverted = (state.isInverted ?? false) !== state.hover;

		// Compute fill/stroke using common pattern
		let fill: string;
		let stroke: string;
		if (color_isInverted) {
			fill = hoverColor;
			stroke = background_color;
		} else {
			fill = background_color;
			stroke = element_color;
		}

		// Compute svg_outline_color
		let svg_outline_color: string;
		if (!state.grabbed && !state.editing) {
			svg_outline_color = thing_color;
		} else if (state.grabbed && !state.editing) {
			svg_outline_color = background_color;
		} else {
			svg_outline_color = isLight ? 'black' : hoverColor;
		}

		return { fill, stroke, svg_outline_color };
	}

	get_buttonColors_for(state: S_Color, element_color: string, background_color: string, hoverColor: string, disabledTextColor: string, border_thickness: number, has_widget_context: boolean = false, thing_color: string = k.empty): { fill: string; stroke: string; border: string } {
		const color_isInverted = (state.isInverted ?? false) !== state.hover;
		const has_border = border_thickness > 0;
		const border_style = has_border ? `solid ${colors.border} ${border_thickness}px` : 'none';

		// Compute fill
		let fill: string;
		if (state.isDisabled) {
			fill = 'transparent';
		} else if (state.isSelected) {
			fill = 'lightblue';
		} else if (color_isInverted) {
			fill = hoverColor;
		} else {
			fill = background_color;
		}

		// Compute stroke
		let stroke: string;
		if (state.isDisabled) {
			stroke = disabledTextColor;
		} else if (color_isInverted) {
			stroke = background_color;
		} else {
			stroke = element_color;
		}

		// Compute border
		let border: string;
		if (has_widget_context && thing_color !== k.empty) {
			if (state.editing) {
				border = `dashed ${thing_color} 1px`;
			} else if (state.focus && controls.inRadialMode) {
				border = `solid ${thing_color} 1px`;
			} else {
				border = border_style;
			}
		} else {
			border = border_style;
		}

		return { fill, stroke, border };
	}

}

export const styles = new Styles();
