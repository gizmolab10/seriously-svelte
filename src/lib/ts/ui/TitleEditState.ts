import { Path } from '../common/GlobalImports';

export default class TitleEditState {
	stopping: Path | null = null;
	editing: Path | null = null;

	constructor(editing: Path) { this.editing = editing; }
	get isStopping(): boolean { return this.editing != null && this.stopping != null && this.editing.matchesPath(this.stopping); }
	stop() { this.stopping = this.editing; }

}