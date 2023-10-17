import { Thing, DBType, DataKind, Hierarchy, Relationship, CreationFlag } from '../common/GlobalImports';
import { thingsArrived } from '../managers/State';
import DBInterface from './DBInterface';
import Airtable from 'airtable';

//////////////////////////////
//							//
//		users				//
//		things				//
//		access				//
//		relationships		//
//		predicates			//
//							//
//////////////////////////////

export default class DBAirtable implements DBInterface {
	basePublic = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('appq1IjzmiRdlZi3H');
	baseCatalist = new Airtable({ apiKey: 'keyb0UJGLoLqPZdJR' }).base('apphGUCbYIEJLvRrR');
	base = this.baseCatalist;
	relationships_table = this.base(DataKind.relationships);
	predicates_table = this.base(DataKind.predicates);
	things_table = this.base(DataKind.things);
	access_table = this.base(DataKind.access);
	users_table = this.base(DataKind.users);
	_hierarchy: Hierarchy | null = null;
	dbType = DBType.airtable;
	hasData = false;
	loadTime = null;

	relationships_errorMessage = 'Error in Relationships:';
	setHasData(flag: boolean) { this.hasData = flag; }
	things_errorMessage = 'Error in Things:';
	async fetch_allFrom(bulkName: string) {}
	
	get hierarchy(): Hierarchy { 
		if (this._hierarchy == null) {
			this._hierarchy = new Hierarchy(this);
		}
		return this._hierarchy!;
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
					this.hierarchy.thing_remember_runtimeCreate(id, remoteThing.fields.title as string, remoteThing.fields.color as string, remoteThing.fields.trait as string, -1, true);
				}
				thingsArrived.set(true);
			})
		} catch (error) {
			console.log(this.things_errorMessage + ' (things_readAll) ' + error);
		}
	}

	////////////////////////////
	//			THING		  //
	////////////////////////////

	async thing_remoteCreate(thing: Thing) {
		try {
			const fields = await this.things_table.create(thing.fields);
			const id = fields['id']; //	// need for update, delete and knownTs_byID (to get parent from relationship)
			thing.id = id;
			thing.isRemotelyStored = true;
			this.hierarchy.thing_remember(thing);
		} catch (error) {
			thing.log(this.things_errorMessage + error);
		}
	}

	async thing_remoteUpdate(thing: Thing) {
		try {
			await this.things_table.update(thing.id, thing.fields);
		} catch (error) {
			thing.log(this.things_errorMessage + error);
		}
	}

	async thing_remoteDelete(thing: Thing) {
		try {
			this.hierarchy.thing_forget(thing);		// do first so UX updates quickly
			await this.things_table.destroy(thing.id);
		} catch (error) {
			thing.log(this.things_errorMessage + error);
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
				const tos = record.fields.to as (string[]);
				const order = record.fields.order as number;
				const froms = record.fields.from as (string[]);
				const predicates = record.fields.predicate as (string[]);
				this.hierarchy.relationship_remember_runtimeCreate(id, predicates[0], froms[0], tos[0], order, CreationFlag.isFromRemote);
			}
		} catch (error) {
			console.log(this.relationships_errorMessage + error);
		}
	}

	//////////////////////////////////////
	//			 RELATIONSHIP			//
	//////////////////////////////////////

	async relationship_remoteCreate(relationship: Relationship | null) {
		if (relationship) {
			try {
				const fields = await this.relationships_table.create(relationship.fields);	// insert with temporary id
				const id = fields['id'];																										// grab permanent id
				relationship.id = id;
				relationship.isRemotelyStored = true;
				this.hierarchy.relationships_refreshKnowns();
			} catch (error) {
				relationship.log(this.relationships_errorMessage + error);
			}
		}
	}

	async relationship_remoteUpdate(relationship: Relationship) {
		try {
			this.relationships_table.update(relationship.id, relationship.fields);
		} catch (error) {
			relationship.log(this.relationships_errorMessage + error);
		}
	}

	async relationship_remoteDelete(relationship: Relationship) {
		try {
			this.hierarchy.knownRs = this.hierarchy.knownRs.filter((relationship: Relationship) => relationship.id !== relationship.id);
			this.hierarchy.relationships_refreshKnowns(); // do first so UX updates quickly
			await this.relationships_table.destroy(relationship.id);
		} catch (error) {
			relationship.log(this.relationships_errorMessage + error);
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
			console.log('Error in Predicates:' + error);
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
			console.log('Error in Access:' + error);
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
			console.log('Error in Users:' + error);
		}
	}

}

export const dbAirtable = new DBAirtable();