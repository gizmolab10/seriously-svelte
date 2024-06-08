import { k, IDTool, Ancestry, ElementType } from '../common/GlobalImports';
import Identifiable from "../data/Identifiable";

// data about html elements that has to persist 
// while the element itself is replaced
// this allows them to cause the context
// around them to be rebuilt
// without losing their appearance

export default class ElementState {
	hoverCursor = k.cursor_default;
	identifiable!: Identifiable;
	hoverColor = 'transparent';
	type = ElementType.tool;
	auxiliary = k.empty;
	isOut = true;

	constructor(identifiable: Identifiable, type: ElementType, auxiliary: IDTool) {
		this.identifiable = identifiable;
		this.auxiliary = auxiliary;
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
	setIsOut(isOut: boolean) { this.isOut = isOut; }
	get border(): string { return k.empty; }
	static none() { return {}; }

}
