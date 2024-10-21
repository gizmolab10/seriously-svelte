import Ancestry from '../managers/Ancestry';

export default class Title_State {
	stopping!: Ancestry;
	editing!: Ancestry;

	constructor(editing: Ancestry) { this.editing = editing; }
	get isStopping(): boolean { return !!this.editing && !!this.stopping && this.editing.matchesAncestry(this.stopping); }
	stop() { this.stopping = this.editing; }

}