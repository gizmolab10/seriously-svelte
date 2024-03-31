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
		const idTa = this.localName('A');
		const idTb = this.localName('B');
		const idTc = this.localName('C');
		const idTd = this.localName('D');
		const idTe = this.localName('E');
		const idTr = this.localName('Root');
		const idPc = this.localName('Pc');
		const idPr = this.localName('Pr');
		h.predicate_remember_runtimeCreateUnique(idPc, 'contains', false);
		h.predicate_remember_runtimeCreateUnique(idPr, 'relatesTo', false);
		h.thing_remember_runtimeCreateUnique('', idTa, 'first', 'red', '1', false);
		h.thing_remember_runtimeCreateUnique('', idTb, 'second', 'blue', '2', false);
		h.thing_remember_runtimeCreateUnique('', idTc, 'third', 'orange', '3', false);
		h.thing_remember_runtimeCreateUnique('', idTd, 'sibling', 'green', 'a', false);
		h.thing_remember_runtimeCreateUnique('', idTe, 'another', 'orchid', 'a', false);
		h.thing_remember_runtimeCreateUnique('', idTr, 'start', 'plum', IDTrait.root, false);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Ra'), idPc, idTr, idTa, 0);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Rb'), idPc, idTr, idTb, 1);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Rc'), idPc, idTr, idTc, 2);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Rc'), idPr, idTr, idTc, 2);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Rd'), idPc, idTa, idTb, 0);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Re'), idPc, idTa, idTd, 1);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Rf'), idPc, idTa, idTe, 2);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Rg'), idPc, idTb, idTc, 1);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Rh'), idPc, idTc, idTd, 0);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Ri'), idPc, idTe, idTd, 0);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Rj'), idPc, idTe, idTb, 1);
		h.relationship_remember_runtimeCreateUnique('', this.localName('Rk'), idPc, idTb, idTd, 1);
	};

	queryStrings_apply() {}
	async fetch_allFrom(baseID: string) {}
	async thing_remoteUpdate(thing: Thing) {}
	async thing_remoteDelete(thing: Thing) {}
	async thing_remember_remoteCreate(thing: Thing) {}
	async relationship_remoteUpdate(relationship: Relationship) {}
	async relationship_remoteDelete(relationship: Relationship) {}
	async relationship_remember_remoteCreate(relationship: Relationship | null) {}
}

export const dbLocal = new DBLocal();