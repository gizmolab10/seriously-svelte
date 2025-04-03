import { k, ux, debug, Ancestry, T_Element } from '../common/Global_Imports';
import { w_background_color } from '../../ts/common/Stores';
import Identifiable from '../data/runtime/Identifiable';
	
export default class S_Element {
	responder: HTMLElement | null = null;
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	identifiable!: Identifiable;
	color_background = k.empty;
	hoverColor = 'transparent';
	type = T_Element.none;
	hoverIgnore = false;
	isSelected = false;
	isInverted = false;
	subtype = k.empty;
	name = k.empty;
	isOut = true;

	//////////////////////////////////////////////////
	//												//
	//	state of html elements persists				//
	//		while the element itself is replaced	//
	//		thus preserving:						//
	//			stroke, fill, cursor & border		//
	//												//
	//		used by buttons & widgets & editors		//
	//												//
	//////////////////////////////////////////////////

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
	get invertColor(): boolean { return this.isInverted || this.isHovering; }
	get cursor(): string { return this.isHovering ? this.hoverCursor : this.defaultCursor; }
	get stroke(): string { return this.invertColor ? this.color_background : this.hoverColor; }
	get isHovering(): boolean { return this.hoverIgnore ? false : this.isOut == this.identifiable.isHoverInverted(this.type); }

	get fill(): string {
		return this.invertColor ? this.hoverColor : this.isSelected ? 'lightblue' : this.color_background;
	}

	set_forHovering(hoverColor: string, hoverCursor: string) {
		this.hoverCursor = hoverCursor;
		this.hoverColor = hoverColor;
	}
	
	get border(): string {
		let color = this.ancestry.thing?.color;
		if (this.type == T_Element.widget) {
			debug.log_colors(`  WIDGET S_Element "${this.ancestry.thing?.type}" "${color}" "${this.ancestry.title}"`);
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
