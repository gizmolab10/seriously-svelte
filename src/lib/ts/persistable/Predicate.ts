import { k, debug, E_Debug, databases, E_Kinship, E_Predicate } from '../common/Global_Imports';
import { w_hierarchy, w_ring_rotation_angle } from '../common/Stores';
import Persistable from '../persistable/Persistable';
import { E_Persistable } from '../database/DBCommon';
import { get } from 'svelte/store';

export default class Predicate extends Persistable {
	isBidirectional: boolean;
	kind: E_Predicate;

	constructor(id: string, kind: E_Predicate, isBidirectional: boolean, already_persisted: boolean = false) {
		super(databases.db_now.e_database, k.empty, E_Persistable.predicates, id, already_persisted);
		this.isBidirectional = isBidirectional;
		this.kind			 = kind;
	}
	
	log(option: E_Debug, message: string)					 { debug.log_alert(option, message + k.space + this.description); }
	get description():					  			  string { return this.kind.unCamelCase().lastWord(); }
	static isBidirectional_for(kind: E_Predicate):	 boolean { return kind != E_Predicate.contains; }
	static get contains():				    Predicate | null { return this.predicate_forKind(E_Predicate.contains); }
	static get explains():				    Predicate | null { return this.predicate_forKind(E_Predicate.explains); }
	static get requires():				    Predicate | null { return this.predicate_forKind(E_Predicate.requires); }
	static get supports():				    Predicate | null { return this.predicate_forKind(E_Predicate.supports); }
	static get isRelated():				    Predicate | null { return this.predicate_forKind(E_Predicate.isRelated); }
	static get appreciates():			  	Predicate | null { return this.predicate_forKind(E_Predicate.appreciates); }
	static predicate_forKind(kind: string): Predicate | null { return get(w_hierarchy).predicate_forKind(kind) ?? null; }

	kinship_forPoints_toChildren(points_toChildren: boolean): E_Kinship | null {
		switch (this.kind) {
			case E_Predicate.contains:	return points_toChildren ? E_Kinship.child : E_Kinship.parent;
			case E_Predicate.isRelated:	return E_Kinship.related;
			default:					return null;
		}
	}

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.predicate_persistentUpdate(this);
		} else {
			await databases.db_now.predicate_remember_persistentCreate(this);
		}
	}
	
	angle_ofCluster_when(points_toChildren: boolean): number {
		// returns one of three angles: 1) children_angle 2) opposite+tweak 3) opposite-tweak
		const tweak = 2 * Math.PI / 3;					// equilateral distribution
		const children_angle = get(w_ring_rotation_angle);
		const raw = this.isBidirectional ?
			children_angle + tweak :
			points_toChildren ? children_angle :		// one directional, use global
			children_angle - tweak;
		return raw.angle_normalized() ?? 0;
	}

}