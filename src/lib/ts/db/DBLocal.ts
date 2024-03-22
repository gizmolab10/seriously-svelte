import { Thing, TypeDB, IDTrait, Hierarchy, Relationship } from '../common/GlobalImports';
import DBInterface from './DBInterface';

export default class DBLocal implements DBInterface {
	_hierarchy: Hierarchy | null = null;
	baseID = 'handcrafted';
	dbType = TypeDB.local;
	hasData = false;
	loadTime = null;

	get hierarchy(): Hierarchy { 
		if (this._hierarchy == null) {
			this._hierarchy = new Hierarchy(this);
		}
		return this._hierarchy!;
	}

	setHasData(flag: boolean) { this.hasData = flag; }
	localName(suffix: string) { return 'local' + suffix; }

	async fetch_all() {
		const h = this.hierarchy;
		const idA = this.localName('A');
		const idB = this.localName('B');
		const idC = this.localName('C');
		const idD = this.localName('D');
		const idE = this.localName('E');
		const idR = this.localName('Root');
		const idP = this.localName('P');
		h.predicate_remember_runtimeCreateUnique(idP, 'contains', false);
		h.thing_remember_runtimeCreateUnique('', idA, 'first', 'red', '1', false);
		h.thing_remember_runtimeCreateUnique('', idC, 'third', 'orange', '3', false);
		h.thing_remember_runtimeCreateUnique('', idD, 'sibling', 'green', 'a', false);
		h.thing_remember_runtimeCreateUnique('', idB, 'second', 'salmon', '2', false);
		h.thing_remember_runtimeCreateUnique('', idE, 'another', 'orchid', 'a', false);
		h.thing_remember_runtimeCreateUnique('', idR, 'seriously', 'plum', IDTrait.root, false);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Dr'), idP, idA, idD, 0);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Er'), idP, idA, idE, 1);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Ar'), idP, idR, idA, 0);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Br'), idP, idR, idB, 1);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Cr'), idP, idR, idC, 2);
	};

	applyQueryStrings() {}
	async fetch_allFrom(baseID: string) {}
	async thing_remoteUpdate(thing: Thing) {}
	async thing_remoteDelete(thing: Thing) {}
	async thing_remember_remoteCreate(thing: Thing) {}
	async relationship_remoteUpdate(relationship: Relationship) {}
	async relationship_remoteDelete(relationship: Relationship) {}
	async relationship_remember_remoteCreate(relationship: Relationship | null) {}
}

export const dbLocal = new DBLocal();