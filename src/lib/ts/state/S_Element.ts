import { k, ux, debug, colors, Ancestry, T_Element } from '../common/Global_Imports';
import { w_background_color } from '../../ts/common/Stores';
import Identifiable from '../runtime/Identifiable';
	
export default class S_Element {
	responder: HTMLElement | null = null;
	defaultDisabledColor = '#999999';
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	identifiable!: Identifiable;
	color_background = k.empty;
	hoverColor = 'transparent';
	type = T_Element.none;
	ignore_hover = false;
	isDisabled = false;
	isSelected = false;
	isInverted = false;
	subtype = k.empty;
	name = k.empty;
	isOut = true;

	//////////////////////////////////////////
	//										//
	//	used by buttons & segments, to		//
	//	preserve state across reattachment	//
	//										//
	//	   stroke, fill, cursor & border	//
	//										//
	//////////////////////////////////////////

	constructor(identifiable: Identifiable, type: T_Element, subtype: string) {
		this.name = ux.name_from(identifiable, type, subtype);
		this.identifiable = identifiable;
		this.subtype = subtype;
		this.type = type;
		w_background_color.subscribe((color: string) => {
			this.color_background = color;
		})
	}

	static empty() { return {}; }
	get ancestry(): Ancestry { return this.identifiable as Ancestry; }
	get color_isInverted(): boolean { return this.isInverted || this.isHovering; }
	get description(): string { return `${this.isOut ? 'out' : 'in '} '${this.name}'`; }
	get cursor(): string { return (this.isHovering && !this.isDisabled) ? this.hoverCursor : this.defaultCursor; }
	get isHovering(): boolean { return this.ignore_hover ? false : this.isOut == this.identifiable.isHoverInverted(this.type); }
	get stroke(): string { return this.isDisabled ? this.disabledTextColor : this.color_isInverted ? this.color_background : this.hoverColor; }
	get disabledTextColor(): string { return colors.specialBlend(this.color_background, this.defaultDisabledColor, 0.3) ?? this.defaultDisabledColor; }
	get fill(): string { return this.isDisabled ? 'transparent' : this.color_isInverted ? this.hoverColor : this.isSelected ? 'lightblue' : this.color_background; }

	set_forHovering(hoverColor: string, hoverCursor: string) {
		this.hoverCursor = hoverCursor;
		this.hoverColor = hoverColor;
	}
	
	get border(): string {
		let color = this.ancestry.thing?.color;
		if (this.type == T_Element.widget) {
			debug.log_colors(`  WIDGET S_Element "${this.ancestry.thing?.t_thing}" "${color}" "${this.ancestry.title}"`);
		}
		if (!!color) {
			if (this.ancestry.isEditing) {
				return `dashed ${color} 1px`;
			}
			if (this.ancestry.isGrabbed) {
				return `solid ${color} 1px`;
			}
		}
		return 'none';
	}

}
