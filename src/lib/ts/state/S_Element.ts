import { Ancestry, S_Widget, T_Element, T_Control } from '../common/Global_Imports';
import { k, s, x, colors, elements, controls } from '../common/Global_Imports';
import Identifiable from '../runtime/Identifiable';
import { get } from 'svelte/store';

	//////////////////////////////////////////
	//										//
	//	single point of truth for			//
	//	  stroke, fill, cursor & border of	//
	//	  buttons, segments & widget dots	//
	//	  using hover, grabbed, expanded	//
	//										//
	//	NEED to move dots to S_Widget?		//
	//										//
	//////////////////////////////////////////

export default class S_Element {
	html_element: HTMLElement | null = null;
	s_widget: S_Widget | null = null;		// only for dots
	defaultDisabledColor = '#999999';
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	identifiable!: Identifiable;
	color_background = 'white';
	hoverColor = 'transparent';
	type = T_Element.none;
	isDisabled = false;
	isSelected = false;
	isInverted = false;		// means color for hover == as though not hovering (and vice versa)
	subtype = k.empty;
	isFocus = false;
	name = k.empty;

	constructor(identifiable: Identifiable, type: T_Element, subtype: string, s_widget: S_Widget | null = null) {
		this.name = elements.name_from(identifiable, type, subtype);
		this.identifiable = identifiable;
		this.s_widget = s_widget;
		this.subtype = subtype;
		this.type = type;
		if (this.isADot) {
			x.si_grabs.w_items.subscribe((grabbed: Ancestry[]) => {
				this.isInverted = !!grabbed && grabbed.includes(this.ancestry);
			});
			if (type == T_Element.control) {
				console.log(`subtype: ${subtype}`);
			}
			this.color_background = subtype == T_Control.search ? 'transparent' : get(colors.w_background_color);
		}
	}

	static empty() { return {}; }
	get isHovering(): boolean { return get(s.w_s_hover) == this; }
	get ancestry(): Ancestry { return this.identifiable as Ancestry; }
	get color_isInverted(): boolean { return this.isInverted != this.isHovering; }
	get description(): string { return `${this.isHovering ? 'in' : 'out '} '${this.name}'`; }
	get isADot(): boolean { return this.type == T_Element.drag || this.type == T_Element.reveal; }
	get svg_hover_color(): string { return this.isHovering ? colors.background : this.stroke; }
	get show_help_cursor(): boolean { return get(s.w_control_key_down) && this.type == T_Element.action; }
	get stroke(): string { return this.isDisabled ? this.disabledTextColor : this.color_isInverted ? this.color_background : this.hoverColor; }
	get cursor(): string { return (this.isHovering && !this.isDisabled) ? this.show_help_cursor ? 'help' : this.hoverCursor : this.defaultCursor; }
	get disabledTextColor(): string { return colors.specialBlend(this.color_background, this.defaultDisabledColor, 0.3) ?? this.defaultDisabledColor; }
	get fill(): string { return this.isDisabled ? 'transparent' : this.color_isInverted ? this.hoverColor : this.isSelected ? 'lightblue' : this.color_background; }

	set isHovering(isHovering: boolean) {
		const old_hover = get(s.w_s_hover);
		const same = old_hover == this;
		let new_hover = isHovering ? this : this.s_widget;
		// if !same and isHovering, set to this, if same and !isHovering, set to null, otherwise leave it unchanged
		if (same != isHovering && new_hover != old_hover) {
			s.w_s_hover.set(new_hover);
		}
	}

	get svg_outline_color(): string {
		const thing_color = this.ancestry.thing?.color ?? k.empty;
		const isLight = colors.luminance_ofColor(thing_color) > 0.5;
		return (!this.ancestry.isGrabbed && !this.ancestry.isEditing)
			? thing_color
			: (this.ancestry.isGrabbed && !this.ancestry.isEditing)
			? this.color_background
			: isLight
			? 'black'
			: this.hoverColor	;
	}

	set_forHovering(hoverColor: string, hoverCursor: string) {
		this.hoverCursor = hoverCursor;
		this.hoverColor = hoverColor;
	}

	get isHoverInverted(): boolean {
		if (this.isADot) {
			const a = this.ancestry;
			switch (this.type) {
				case T_Element.reveal: return controls.inTreeMode && a.isExpanded == a.isEditing;
				default:			   return a.isEditing;
			}
		} else {
			return this.isInverted;
		}
	}
	
	get border(): string {
		const color = this.ancestry.thing?.color;
		if (!!color) {
			if (this.ancestry.isEditing) {
				return `dashed ${color} 1px`;
			}
			if (this.ancestry.isFocus) {
				return `solid ${color} 1px`;
			}
			if (this.isHovering) {
				return `solid ${colors.ofBackgroundFor(color)} 1px`;
			}
		}
		return 'solid transparent 1px';
	}

}
