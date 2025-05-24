import { Thing, databases, T_Persistable } from '../common/Global_Imports';
import Persistable from './Persistable';

export default class Tag extends Persistable {
	thingIDs: Array<string> = [];
	type: string = '';
	
	constructor(idBase: string, id: string, type: string, things: Array<Thing>, already_persisted: boolean = false) {
		super(databases.db_now.t_database, idBase, T_Persistable.tags, id, already_persisted);
		this.thingIDs = things.map((thing) => thing.id);
		this.type = type;
	}


}
