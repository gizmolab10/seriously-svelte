import Persistence_State from './Persistence_State';
import { s_hierarchy } from '../../state/S_Stores';
import Identifiable from './Identifiable';
import { T_Datum } from '../dbs/DBCommon';
import { get } from 'svelte/store';

export default class Persistent_Identifiable extends Identifiable {
	persistence!: Persistence_State;

	constructor(type_db: string, type_datum: T_Datum, id: string, already_persisted: boolean = false) {
		super(id);
		this.persistence = new Persistence_State(type_db, type_datum, id, already_persisted, false);
		get(s_hierarchy).signal_storage_redraw();
	}

	async persistent_create_orUpdate(already_persisted: boolean) {}
	set_isDirty() { this.persistence.isDirty = true; }		// TODO: set global

	async persist() {
		await this.persistence.persist_withClosure(async (already_persisted: boolean) => {
			await this.persistent_create_orUpdate(already_persisted);
		});
	}

}
