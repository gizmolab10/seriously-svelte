import Ancestry from '../data/runtime/Ancestry';

export default class S_Title_Edit {
	stopping: string | null = null;
	mutating: string | null = null;
	editing!: string;		
	
	// single source of truth
	// ancestry uses this class:
	// created by ancestry.startEdit()
	// both of the following get-vars reference this object
	// {isStoppingEdit, isEditing}
	// title editor calls blur if isStoppingEdit is true

	constructor(editing: Ancestry) { this.editing = editing.id; }
	mutate(start: boolean = true) { this.mutating = start ? this.editing : null; }
	stop(stop: boolean = true) { this.stopping = (stop ? this.editing : null); this.mutate(false); }
	get isStopping(): boolean { return !!this.editing && !!this.stopping && this.editing == this.stopping; }

}