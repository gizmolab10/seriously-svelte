import { k, ux, Ancestry, T_Element } from '../common/Global_Imports';
import Identifiable from '../data/runtime/Identifiable';

export default class S_Element {
	color_background = k.color_background;
	responder: HTMLElement | null = null;
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	identifiable!: Identifiable;
	hoverColor = 'transparent';
	type = T_Element.none;
	hoverIgnore = false;
	isInverted = false;
	subtype = k.empty;
	name = k.empty;
	isOut = true;

	//////////////////////////////////////////////////
	//												//
	//	isOut state of html elements persists		//
	//		while the element itself is replaced	//
	//		thus preserving:						//
	//			stroke, fill, cursor & border		//
	//												//
	//		used by buttons & widgets				//
	//												//
	//////////////////////////////////////////////////

	constructor(identifiable: Identifiable, type: T_Element, subtype: string) {
		this.name = ux.name_from(identifiable, type, subtype);
		this.identifiable = identifiable;
		this.subtype = subtype;
		this.type = type;
	}

	static none() { return {}; }
	get ancestry(): Ancestry { return this.identifiable as Ancestry; }
	get invertColor(): boolean { return this.isInverted || this.isHovering; }
	get cursor(): string { return this.isHovering ? this.hoverCursor : this.defaultCursor; }
	get fill(): string { return this.invertColor ? this.hoverColor : this.color_background; }
	get stroke(): string { return this.invertColor ? this.color_background : this.hoverColor; }
	get isHovering(): boolean { return this.hoverIgnore ? false : this.isOut == this.identifiable.isHoverInverted(this.type); }
	
	set_forHovering(hoverColor: string, hoverCursor: string) {
		this.hoverCursor = hoverCursor;
		this.hoverColor = hoverColor;
	}
	
	get border(): string {
		let color = this.ancestry.thing?.color;
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
