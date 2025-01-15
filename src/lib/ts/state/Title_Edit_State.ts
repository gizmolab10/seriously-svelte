import Ancestry from '../data/basis/runtime/Ancestry';

export default class Title_Edit_State {
	stopping: Ancestry | null = null;
	editing!: Ancestry;

	stop() { this.stopping = this.editing; }
	constructor(editing: Ancestry) { this.editing = editing; }
	get isStopping(): boolean { return !!this.editing && !!this.stopping && this.editing.ancestry_hasEqualID(this.stopping); }

}