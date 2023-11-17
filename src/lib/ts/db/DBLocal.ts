import { Thing, DBType, TraitType, Hierarchy, Relationship } from '../common/GlobalImports';
import DBInterface from './DBInterface';

export default class DBLocal implements DBInterface {
	_hierarchy: Hierarchy | null = null;
	dbType = DBType.local;
	hasData = false;
	loadTime = null;

	get hierarchy(): Hierarchy { 
		if (this._hierarchy == null) {
			this._hierarchy = new Hierarchy(this);
		}
		return this._hierarchy!;
	}

	localName(suffix: string) { return 'local' + suffix; }
	setHasData(flag: boolean) { this.hasData = flag; }

	async fetch_all() {
		const h = this.hierarchy;
		const idPredicate = this.localName('P');
		const idRoot = this.localName('Root');
		const idA = this.localName('A');
		const idB = this.localName('B');
		const idC = this.localName('C');
		const idD = this.localName('D');
		const idE = this.localName('E');
		h.predicate_remember_runtimeCreate(idPredicate, 'isAParentOf');
		h.thing_remember_runtimeCreate('', idA, 'first', 'red', '1', 0, true);
		h.thing_remember_runtimeCreate('', idB, 'sibling', 'green', 'a', 1, true);
		h.thing_remember_runtimeCreate('', idC, 'another', 'orchid', 'a', 2, true);
		h.thing_remember_runtimeCreate('', idD, 'second', 'salmon', '2', 0, true);
		h.thing_remember_runtimeCreate('', idE, 'third', 'orange', '3', 1, true);
		h.thing_remember_runtimeCreate('', idRoot, 'seriously', 'plum', TraitType.root, 0, true);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Ar'), idPredicate, idRoot, idA, 0);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Br'), idPredicate, idRoot, idB, 1);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Cr'), idPredicate, idRoot, idC, 2);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Dr'), idPredicate, idA, idD, 0);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Er'), idPredicate, idA, idE, 1);
	};

	async fetch_allFrom(bulkID: string) {}
	async thing_remoteUpdate(thing: Thing) {}
	async thing_remoteDelete(thing: Thing) {}
	async thing_remember_remoteCreate(thing: Thing) {}
	async relationship_remoteUpdate(relationship: Relationship) {}
	async relationship_remoteDelete(relationship: Relationship) {}
	async relationship_remember_remoteCreate(relationship: Relationship | null) {}
}

export const dbLocal = new DBLocal();