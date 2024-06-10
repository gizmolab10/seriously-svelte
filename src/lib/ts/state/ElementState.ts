import { k, IDTool, Ancestry, ElementType } from '../common/GlobalImports';
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
	//		thus preserving its colors				//
	//												//
	//	used by buttons and widgets					//
	//		some crumbs use the normal cursor		//
	//												//
	//////////////////////////////////////////////////

	constructor(identifiable: Identifiable, type: ElementType, subtype: string) {
		this.name = ElementState.elementName_from(identifiable, type, subtype);
		this.identifiable = identifiable;
		this.subtype = subtype;
		this.type = type;
	}

	set_forHovering(hoverColor: string, hoverCursor: string) {
		this.hoverCursor = hoverCursor;
		this.hoverColor = hoverColor;
	}

	get stroke(): string { return this.isOut ? this.hoverColor : k.color_background; }
	get cursor(): string { return this.isOut ? k.cursor_default : this.hoverCursor; }
	get ancestry(): Ancestry | null { return this.identifiable as Ancestry ?? null; }
	get fill(): string { return this.isOut ? k.color_background : this.hoverColor; }
	get border(): string { return k.empty; }
	static none() { return {}; }

	static elementName_from(identifiable: Identifiable, type: ElementType, subtype: string): string {
		return `${type}-${subtype}-${identifiable.id}`;
	}

}
