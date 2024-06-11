import { k, Ancestry, ElementType } from '../common/GlobalImports';
import Identifiable from '../data/Identifiable';

export default class ElementState {
	hoverCursor = k.cursor_default;
	identifiable!: Identifiable;
	hoverColor = 'transparent';
	type = ElementType.tool;
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
		this.name = ElementState.elementName_from(identifiable, type, subtype);
		this.identifiable = identifiable;
		this.subtype = subtype;
		this.type = type;
	}

	static none() { return {}; }
	get ancestry(): Ancestry { return this.identifiable as Ancestry; }
	get fill(): string { return this.isHovering ? this.hoverColor : k.color_background; }
	get cursor(): string { return this.isHovering ? this.hoverCursor : k.cursor_default; }
	get stroke(): string { return this.isHovering ? k.color_background : this.hoverColor; }
	get isHovering(): boolean { return this.isOut == this.identifiable.isHoverInverted(this.type); }

	static elementName_from(identifiable: Identifiable, type: ElementType, subtype: string): string {
		return `${type}-${subtype}-${identifiable.id}`;
	}

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
