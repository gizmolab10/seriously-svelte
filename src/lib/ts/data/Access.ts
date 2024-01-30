import Identifiable from '../common/Identifiable';
export default class Access extends Identifiable {
	kind: string;

	constructor(id: string, kind: string) {
		super(id);
		this.kind = kind;
	}
}