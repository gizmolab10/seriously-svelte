import { databases, T_Persistable } from '../common/Global_Imports';
import type { Integer } from '../common/Types';
import Persistable from './Persistable';

export default class Tag extends Persistable {
	thingHIDs: Array<Integer> = [];
	type: string = '';
	
	constructor(idBase: string, id: string, type: string, thingHID: Integer, already_persisted: boolean = false) {
		super(databases.db_now.t_database, idBase, T_Persistable.tags, id, already_persisted);
		this.thingHIDs = [thingHID];
		this.type = type;
	}

	async persistent_create_orUpdate(already_persisted: boolean) {
		if (already_persisted) {
			await databases.db_now.tag_persistentUpdate(this);
		} else {
			await databases.db_now.tag_remember_persistentCreate(this);
		}
	}

}
