import { k, colors, Ancestry, S_Element, T_Element, layout } from '../common/Global_Imports';
import { w_background_color } from '../common/Stores';
import { get } from 'svelte/store';

export default class S_Widget extends S_Element {
	isGrabbed = false;		// NOT a source of truth
	isEditing = false;		// ... only needed for detecting state changes
	isFocus	  = false;

	get stroke(): string { return this.color; }
	get fill(): string { return this.background_color; }
	get thing_color(): string { return this.ancestry.thing?.color ?? k.empty; }
	constructor(ancestry: Ancestry) { super(ancestry, T_Element.widget, k.empty); }
	get isFilled(): boolean { return this.ancestry.isGrabbed && !this.shows_border; }
	get background(): string { return `background-color: ${this.background_color}`; }
	get shows_border(): boolean { return this.ancestry.isFocus || this.ancestry.isEditing; }
	get background_color(): string { return this.isFilled ? this.thing_color : this.shows_border ? get(w_background_color) : 'transparent'; }

	get color(): string {
		const luminance = colors.luminance_ofColor(this.thing_color);
		const color = (this.isFilled) ? (luminance > 0.5 ? 'black' : 'white') : this.thing_color;
		console.log(`edi: ${this.ancestry.isEditing}  foc: ${this.ancestry.isFocus}  fil: ${this.isFilled}  col: ${color}  bor: ${this.shows_border}  bak: "${this.background}"  "${this.ancestry.title}"`);
		return color;
	}

	get state_didChange(): boolean {
		const didGrab = this.ancestry.isGrabbed;
		const didEdit = this.ancestry.isEditing;
		const didFocus = this.ancestry.isFocus;
		const change = (this.isEditing != didEdit || this.isGrabbed != didGrab || this.isFocus != didFocus);
		this.isGrabbed = didGrab;
		this.isEditing = didEdit;
		this.isFocus = didFocus;
		return change;
	}

} 