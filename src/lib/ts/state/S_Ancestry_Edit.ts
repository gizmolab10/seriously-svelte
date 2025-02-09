import Ancestry from '../data/runtime/Ancestry';

export default class S_Ancestry_Edit {
	stopping: Ancestry | null = null;
	editing!: Ancestry;

	stop() { this.stopping = this.editing; }
	constructor(editing: Ancestry) { this.editing = editing; }
	get isStopping(): boolean { return !!this.editing && !!this.stopping && this.editing.ancestry_hasEqualID(this.stopping); }

}