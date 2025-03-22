import { k, T_Thing, Predicate, T_Predicate } from '../../common/Global_Imports';
import type { Dictionary } from '../../../ts/common/Types';
import { T_Database, T_Persistence } from './DBCommon';
import DBCommon from './DBCommon';

export default class DBTest extends DBCommon {
	kind_persistence = T_Persistence.none;
	idBase = k.idBase_test;
	t_database = T_Database.test;
	
	get dict_forStorageDetails(): Dictionary { return {'data' : 'recreated on launch'} }

	async fetch_all_fromLocal() {
		const idTa = 'A';
		const idTb = 'B';
		const idTc = 'C';
		const idTd = 'D';
		const idTe = 'E';
		const idTf = 'F';
		const idTr = 'R';
		const h = this.hierarchy;
		const kindC = T_Predicate.contains;
		const kindR = T_Predicate.isRelated;
		h.predicate_defaults_remember_runtimeCreate();
		h.thing_remember_runtimeCreateUnique(this.idBase, idTa, 'Active', 'green');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTb, 'Maintain', 'blue');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTc, 'Curiosity', '#d96726');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTd, 'Aesthetics', 'mediumvioletred');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTe, 'Autonomy', 'purple');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTf, 'Connections', 'coral');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTr, 'Life', 'limegreen', T_Thing.root);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Cra', kindC, idTr, idTa, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Crb', kindC, idTr, idTb, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Crc', kindC, idTr, idTc, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Crd', kindC, idTr, idTd, 3);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Cre', kindC, idTr, idTe, 4);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Cab', kindC, idTa, idTb, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Cac', kindC, idTa, idTc, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Cad', kindC, idTa, idTd, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Cae', kindC, idTa, idTe, 3);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Cbc', kindC, idTb, idTc, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Cbd', kindC, idTb, idTd, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Cbe', kindC, idTb, idTe, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Cbf', kindC, idTb, idTf, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Ccd', kindC, idTc, idTd, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Cce', kindC, idTc, idTe, 1);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Cde', kindC, idTd, idTe, 0);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Rrb', kindR, idTr, idTb, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Rbd', kindR, idTb, idTd, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Rac', kindR, idTa, idTc, 2);
		h.relationship_remember_runtimeCreateUnique(this.idBase, 'Rce', kindR, idTc, idTe, 2);
		this.makeMore(2, 'B', kindC, idTc, true);	// children of Curiosity
		this.makeMore(5, 'D', kindC, idTb, true);	// children of Maintain
		this.makeMore(2, 'G', kindC, idTb, false);	// parents of  "
		this.makeMore(5, 'G', kindR, idTb, false);	// related to  "
	}

	makeMore(count: number, first: string, kindPredicate: T_Predicate, idOther: string, asChild: boolean) {
		const isBidirectional = Predicate.isBidirectional(kindPredicate);
		const prefix = isBidirectional ? 'R' : 'C';
		const charCode = first.charCodeAt(0);
		const h = this.hierarchy;
		for (let i = 0; i < count; i++) {
			const idUpper = String.fromCharCode(charCode + i);
			const id_thing = asChild ? idOther + idUpper : idUpper + idOther;
			const title = asChild ? idUpper : id_thing;
			const idRelationahip = prefix + id_thing;
			const idChild = asChild ? id_thing : idOther;
			const idParent = asChild ? idOther : id_thing;
			h.thing_remember_runtimeCreateUnique(this.idBase, id_thing, title, 'grey');
			h.relationship_remember_runtimeCreateUnique(this.idBase, idRelationahip, kindPredicate, idParent, idChild, i);
		}
	}

}

export const dbTest = new DBTest();