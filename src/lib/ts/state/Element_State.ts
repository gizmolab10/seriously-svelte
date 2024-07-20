import { k, s, Ancestry, ElementType } from '../common/Global_Imports';
import Identifiable from '../data/Identifiable';

export default class Element_State {
	color_background = k.color_background;
	responder: HTMLElement | null = null;
	defaultCursor = k.cursor_default;
	hoverCursor = k.cursor_default;
	identifiable!: Identifiable;
	hoverColor = 'transparent';
	type = ElementType.none;
	hoverIgnore = false;
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

	constructor(identifiable: Identifiable, type: ElementType, subtype: string) {
		this.name = s.name_from(identifiable, type, subtype);
		this.identifiable = identifiable;
		this.subtype = subtype;
		this.type = type;
	}

	static none() { return {}; }
	get ancestry(): Ancestry { return this.identifiable as Ancestry; }
	get cursor(): string { return this.isHovering ? this.hoverCursor : this.defaultCursor; }
	get fill(): string { return this.isHovering ? this.hoverColor : this.color_background; }
	get stroke(): string { return this.isHovering ? this.color_background : this.hoverColor; }
	get isHovering(): boolean { return this.hoverIgnore ? false : this.isOut == this.identifiable.isHoverInverted(this.type); }
	
	set_forHovering(hoverColor: string, hoverCursor: string) {
		this.hoverCursor = hoverCursor;
		this.hoverColor = hoverColor;
	}
	
	get border(): string {
		if (this.ancestry.isEditing) {
			return `dashed ${this.ancestry.thing?.color} 1px`;
		} else if (this.ancestry.isGrabbed) {
			return `solid ${this.ancestry.thing?.color} 1px`;
		} else {
			return 'none';
		}
	}

}