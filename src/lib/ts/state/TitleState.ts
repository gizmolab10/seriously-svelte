import { Path } from '../common/GlobalImports';

export default class TitleState {
	stopping!: Path;
	editing!: Path;

	constructor(editing: Path) { this.editing = editing; }
	get isStopping(): boolean { return !!this.editing && !!this.stopping && this.editing.matchesPath(this.stopping); }
	stop() { this.stopping = this.editing; }

}