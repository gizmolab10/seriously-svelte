
import { e, k, hits, colors, S_Snapshot, controls, T_Hit_Target } from '../common/Global_Imports';
import { get } from 'svelte/store';

	//////////////////////////////////////////
	//										//
	//	Color computation functions			//
	//	Centralized logic for computing		//
	//	colors based on component state		//
	//										//
	//////////////////////////////////////////

export default class Styles {

	get_widgetColors_for(ss: S_Snapshot, thing_color: string, background_color: string): { color: string; background_color: string; border: string } {
		const isLight = colors.luminance_ofColor(thing_color) > 0.5;
		const isDown = get(e.w_mouse_button_down) && ss.isHovering;
		const isRadialFocus = ss.isFocus && controls.inRadialMode;
		const t_hover_target = ss.t_hover_target;
		let border = 'solid transparent 1px';
		let background = 'transparent';
		let color = thing_color;
		if (ss.isEditing) {
			background = background_color;
			border = `dashed ${thing_color} 1px`;
			color = isLight ? 'black' : thing_color;
		} else if (ss.isGrabbed || isDown) {
			const invert = ss.isHovering && !isDown;
			color = invert ? thing_color : 'white';
			background = invert ? colors.background_special_blend(thing_color, k.opacity.faint) ?? thing_color : thing_color;
		} else if (isRadialFocus) {
			border = thing_color !== k.empty ? `solid ${thing_color} 1px` : 'solid transparent 1px';
			color = (ss.isHovering || isLight) ? thing_color : 'white';
			background = background_color;
		} else if (ss.isHovering) {
			background = this.background_for(t_hover_target, background_color);
			border = this.border_for(t_hover_target, thing_color);
			if (controls.inRadialMode) {
				border = `solid ${thing_color} 1px`;
				background = background_color;
			}
		}
		return { color, background_color: background, border };
	}

	get_dotColors_for(ss: S_Snapshot, element_color: string, thing_color: string, background_color: string, hoverColor: string): { fill: string; stroke: string; svg_outline_color: string } {
		const color_isInverted = (ss.isInverted ?? false) !== ss.isHovering;
		const isLight = colors.luminance_ofColor(thing_color) > 0.5;
		let outline: string;
		let stroke: string;
		let fill: string;
		if (color_isInverted) {
			fill = hoverColor;
			stroke = background_color;
		} else {
			fill = background_color;
			stroke = element_color;
		}
		if (!ss.isGrabbed && !ss.isEditing) {
			outline = thing_color;
		} else if (ss.isGrabbed && !ss.isEditing) {
			outline = background_color;
		} else {
			outline = isLight ? 'black' : hoverColor;
		}
		return { fill, stroke, svg_outline_color: outline };
	}

	get_buttonColors_for(ss: S_Snapshot, element_color: string, background_color: string, hoverColor: string, disabledTextColor: string, border_thickness: number, has_widget_context: boolean = false, thing_color: string = k.empty): { fill: string; stroke: string; border: string } {
		const border_style = (border_thickness <= 0) ? 'none' : `solid ${colors.border} ${border_thickness}px`;
		const color_isInverted = (ss.isInverted ?? false) !== ss.isHovering;
		let border: string;
		let stroke: string;
		let fill: string;
		if (ss.isDisabled) {
			fill = 'transparent';
		} else if (ss.isSelected) {
			fill = 'lightblue';
		} else if (color_isInverted) {
			fill = hoverColor;
		} else {
			fill = background_color;
		}
		if (ss.isDisabled) {
			stroke = disabledTextColor;
		} else if (color_isInverted) {
			stroke = background_color;
		} else {
			stroke = element_color;
		}
		if (has_widget_context && thing_color !== k.empty) {
			if (ss.isEditing) {
				border = `dashed ${thing_color} 1px`;
			} else if (ss.isFocus && controls.inRadialMode) {
				border = `solid ${thing_color} 1px`;
			} else {
				border = border_style;
			}
		} else {
			border = border_style;
		}
		return { fill, stroke, border };
	}

	background_for(t_hover_target: T_Hit_Target | null, background_color: string): string {
		if (t_hover_target === T_Hit_Target.reveal) {
			return 'transparent';
		}
		return background_color;
	}

	border_for(t_hover_target: T_Hit_Target | null, thing_color: string): string {
		if (thing_color === k.empty) {
			return 'solid transparent 1px';
		}
		let border_color: string;
		switch (t_hover_target) {
			case T_Hit_Target.title:  border_color = thing_color;																   break;
			case T_Hit_Target.drag:   border_color = colors.background_special_blend(thing_color, k.opacity.faint) ?? thing_color; break;
			case T_Hit_Target.reveal: border_color = 'transparent';																   break;
			default:				  border_color = colors.ofBackgroundFor(thing_color);										   break;
		}
		return `solid ${border_color} 1px`;
	}

}

export const styles = new Styles();
