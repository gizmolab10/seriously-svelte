import { debug, Thing, TypeDB, DataKind, Hierarchy, Relationship, CreationOptions, DebugFlag, dbDispatch } from '../common/GlobalImports';
import { s_things_arrived } from '../managers/State';
import DBInterface from './DBInterface';
import Airtable from 'airtable';

//////////////////////////////
//							//
//		users				//
//		things				//
//		access				//
//		predicates			//
//		relationships		//
//							//
//////////////////////////////

export default class DBAirtable implements DBInterface {
	baseCatalist = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('apphGUCbYIEJLvRrR');
	basePublic = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
	base = this.baseCatalist;
	relationships_table = this.base(DataKind.relationships);
	predicates_table = this.base(DataKind.predicates);
	things_table = this.base(DataKind.things);
	access_table = this.base(DataKind.access);
	users_table = this.base(DataKind.users);
	_hierarchy: Hierarchy | null = null;
	dbType = TypeDB.airtable;
	hasData = false;
	loadTime = null;
	baseID = '';

	relationships_errorMessage = 'Error in Relationships:';
	setHasData(flag: boolean) { this.hasData = flag; }
	things_errorMessage = 'Error in Things:';
	async fetch_allFrom(baseID: string) {}
	
	get hierarchy(): Hierarchy { 
		if (this._hierarchy == null) {
			this._hierarchy = new Hierarchy(this);
		}
		return this._hierarchy!;
	}

	applyQueryStrings(params: URLSearchParams) {
		this.baseID = params.get('name') ?? params.get('dbid') ?? 'apphGUCbYIEJLvRrR';
	}

	async fetch_all() {
		await this.things_readAll()
		await this.predicates_readAll();
		await this.relationships_readAll();
		await this.access_readAll();
		await this.users_readAll();
	}

	//////////////////////////////
	//			THINGS			//
	//////////////////////////////

	async things_readAll() {
		this.hierarchy.things_forgetAll(); // clear

		try {
			const select = this.things_table.select();
			await select.all().then((records) => {
				const remoteThings = records;
				for (const remoteThing of remoteThings) {
					const id = remoteThing.id;
					this.hierarchy.thing_remember_runtimeCreate('', id, remoteThing.fields.title as string, remoteThing.fields.color as string, remoteThing.fields.trait as string, 0, true);
				}
				s_things_arrived.set(true);
			})
		} catch (error) {
			debug.log_error(this.things_errorMessage + ' (things_readAll) ' + error);
		}
	}

	////////////////////////////
	//			THING		  //
	////////////////////////////

	async thing_remember_remoteCreate(thing: Thing) {
		try {
			const fields = await this.things_table.create(thing.fields);
			const id = fields['id']; //	// need for update, delete and knownTs_byHID (to get parent from relationship)
			thing.setID(id);
			thing.isRemotelyStored = true;
			this.hierarchy.thing_remember(thing);
		} catch (error) {
			thing.log(DebugFlag.remote, this.things_errorMessage + error);
		}
	}

	async thing_remoteUpdate(thing: Thing) {
		try {
			await this.things_table.update(thing.id, thing.fields);
		} catch (error) {
			thing.log(DebugFlag.remote, this.things_errorMessage + error);
		}
	}

	async thing_remoteDelete(thing: Thing) {
		try {
			this.hierarchy.thing_forget(thing);		// do first so UX updates quickly
			await this.things_table.destroy(thing.id);
		} catch (error) {
			thing.log(DebugFlag.remote, this.things_errorMessage + error);
		}
	}

	//////////////////////////////////////
	//			RELATIONSHIPS			//
	//////////////////////////////////////

	async relationships_readAll() {
		this.hierarchy.relationships_clearKnowns();
		try {
			const records = await this.relationships_table.select().all()

			for (const record of records) {
				const id = record.id as string;
				const tos = record.fields.to as (Array<string>);
				const order = record.fields.order as number;
				const froms = record.fields.from as (Array<string>);
				const predicates = record.fields.predicate as (Array<string>);
				this.hierarchy.relationship_remember_runtimeCreateUnique('', id, predicates[0], froms[0], tos[0], order, CreationOptions.isFromRemote);
			}
		} catch (error) {
			debug.log_error(this.relationships_errorMessage + error);
		}
	}

	//////////////////////////////////////
	//			 RELATIONSHIP			//
	//////////////////////////////////////

	async relationship_remember_remoteCreate(relationship: Relationship | null) {
		if (relationship) {
			try {
				const fields = await this.relationships_table.create(relationship.fields);	// insert with temporary id
				const id = fields['id'];																										// grab permanent id
				relationship.setID(id);
				relationship.isRemotelyStored = true;
				this.hierarchy.relationships_refreshKnowns();
			} catch (error) {
				relationship.log(DebugFlag.remote, this.relationships_errorMessage + error);
			}
		}
	}

	async relationship_remoteUpdate(relationship: Relationship) {
		try {
			this.relationships_table.update(relationship.id, relationship.fields);
		} catch (error) {
			relationship.log(DebugFlag.remote, this.relationships_errorMessage + error);
		}
	}

	async relationship_remoteDelete(relationship: Relationship) {
		try {
			this.hierarchy.knownRs = this.hierarchy.knownRs.filter((relationship: Relationship) => relationship.id !== relationship.id);
			this.hierarchy.relationships_refreshKnowns(); // do first so UX updates quickly
			await this.relationships_table.destroy(relationship.id);
		} catch (error) {
			relationship.log(DebugFlag.remote, this.relationships_errorMessage + error);
		}
	}

	//////////////////////////////////////
	//			ANCILLARY DATA			//
	//////////////////////////////////////

	async predicates_readAll() {
		try {
			const records = await this.predicates_table.select().all()

			for (const record of records) {
				const id = record.id as string; // do not yet need this
				const kind = record.fields.kind as string;
				this.hierarchy.predicate_remember_runtimeCreate(id, kind);
			}

		} catch (error) {
			debug.log_error('Error in Predicates:' + error);
		}
	}

	async access_readAll() {
		try {
			const records = await this.access_table.select().all()

			for (const record of records) {
				const id = record.id as string; // do not yet need this
				const kind = record.fields.kind as string;
				this.hierarchy.access_runtimeCreate(id, kind);
			}

		} catch (error) {
			debug.log_error('Error in Access:' + error);
		}
	}

	async users_readAll() {
		try {
			const records = await this.users_table.select().all()

			for (const record of records) {
				const id = record.id as string; // do not yet need this
				this.hierarchy.user_runtimeCreate(id, record.fields.name as string, record.fields.email as string, record.fields.phone as string);
			}

		} catch (error) {
			debug.log_error('Error in Users:' + error);
		}
	}

}

export const dbAirtable = new DBAirtable();