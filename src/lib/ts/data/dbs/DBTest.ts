import { k, Thing, Trait, T_Thing, Relationship, T_Predicate } from '../../common/Global_Imports';
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
		h.thing_remember_runtimeCreateUnique(this.idBase, idTa, 'Active', 'red');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTb, 'Maintain', 'blue');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTc, 'Curiosity', '#d96726');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTd, 'Autonomy', 'purple');
		h.thing_remember_runtimeCreateUnique(this.idBase, idTe, 'Aesthetics', 'mediumvioletred');
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
		this.makeMore(20, 'G', kindC, idTb, true);	// contained by B
		this.makeMore(5, 'G', kindC, idTb, false);	// containing B
		this.makeMore(5, 'G', kindR, idTb, false);	// related to B
	}

	makeMore(count: number, first: string, kindPredicate: T_Predicate, idOther: string, asChild: boolean) {
		for (let i = 0; i < count; i++) {
			const h = this.hierarchy;
			const code = first.charCodeAt(0) + i;
			const idUpper = String.fromCharCode(code);
			const predicate = h.predicate_forKind(kindPredicate);
			const isBidirectional = predicate?.isBidirectional ?? false;
			const idThing = asChild ? idOther + idUpper : idUpper + idOther;
			const title = asChild ? idUpper : idThing;
			const prefix = isBidirectional ? 'R' : 'C';
			const idRelationahip = prefix + idThing;
			const idChild = asChild ? idThing : idOther;
			const idParent = asChild ? idOther : idThing;
			h.thing_remember_runtimeCreateUnique(this.idBase, idThing, title, 'red');
			h.relationship_remember_runtimeCreateUnique(this.idBase, idRelationahip, kindPredicate, idParent, idChild, 1);
			if (asChild || isBidirectional) {	// needs to be child of root
				const idParentRelationship = 'CR' + idUpper;
				h.relationship_remember_runtimeCreateUnique(this.idBase, idParentRelationship, T_Predicate.contains, h.root.id, idThing, 1);
			}
		}
	}

	async thing_remember_persistentCreate(thing: Thing) { this.hierarchy.thing_remember(thing); }
	async trait_remember_persistentCreate(trait: Trait) { this.hierarchy.trait_remember(trait); }
	async relationship_remember_persistentCreate(relationship: Relationship) { this.hierarchy.relationship_remember_ifValid(relationship); }

}

export const dbTest = new DBTest();