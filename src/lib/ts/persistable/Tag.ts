import { h, k, Thing, databases, T_Persistable } from '../common/Global_Imports';
import type { Integer } from '../common/Types';
import Persistable from './Persistable';

export default class Tag extends Persistable {
	thingHIDs: Array<Integer> = [];
	type: string = '';

	get things(): Array<Thing> {
		return this.thingHIDs.map(hid => h.thing_forHID(hid)).filter(thing => !!thing) as Array<Thing>;
	}

	ownerAt(index: number): Thing | null {
		const things = this.things;
		if (index < things.length) {
			return things[index];
		}
		return null;
	}
	
	constructor(idBase: string, id: string, type: string, thingHIDs: Array<Integer>, glob: string = k.empty, already_persisted: boolean = false) {
		super(databases.db_now.t_database, idBase, T_Persistable.tags, id, glob, already_persisted);
		this.thingHIDs = thingHIDs;
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
