import { s_hierarchy } from '../../state/Svelte_Stores';
import Persistence_State from './Persistence_State';
import Identifiable from './Identifiable';
import { get } from 'svelte/store';

export enum DBType {
	postgres = 'postgres',
	airtable = 'airtable',
	firebase = 'firebase',
	plugin	 = 'plugin',
	local	 = 'local',
	test	 = 'test',
}

export enum DatumType {
	relationships = 'Relationships',
	predicates	  = 'Predicates',
	hierarchy	  = 'Hierarchy',	// includes parent contains and relateds
	progeny		  = 'Progeny',		// only child contains
	things		  = 'Things',
	traits		  = 'Traits',
	access		  = 'Access',
	users		  = 'Users',
}

export default class Persistent_Identifiable extends Identifiable {
	state!: Persistence_State;
	dbType: string;

	constructor(dbType: string, id: string, already_persisted: boolean = false) {
		super(id);
		this.dbType = dbType;
		const hasPersistentStorage = dbType != DBType.test;
		this.state = new Persistence_State(hasPersistentStorage, already_persisted, false, hasPersistentStorage && !already_persisted);
		get(s_hierarchy).signal_storage_redraw();
	}

	async persistent_create_orUpdate(already_persisted: boolean) {}
	set_isDirty() { this.state.isDirty = true; }		// TODO: set global

	async persist() {
		this.state.persist_withClosure(async (already_persisted: boolean) => {
			await this.persistent_create_orUpdate(already_persisted);
		});
	}

}
