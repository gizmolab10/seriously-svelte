import { k, u, debug, Thing, DebugFlag, Hierarchy, Relationship, CreationOptions } from '../common/Global_Imports';
import { s_things_arrived } from '../state/Reactive_State';
import { DBType, DatumType } from '../db/DBInterface';
import DBInterface from './DBInterface';
import { h } from '../db/DBDispatch';
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
	personalAccessToken = 'patGTiWbebGZTw0fh.dd17a194aea98f9e4e918d333babde7bcd39903b4179b139ac8866a5f3cfe5b6';
	baseCatalist = new Airtable({ apiKey: this.personalAccessToken }).base('apphGUCbYIEJLvRrR');
	basePublic = new Airtable({ apiKey: this.personalAccessToken }).base('appq1IjzmiRdlZi3H');
	base = this.basePublic;
	relationships_table = this.base(DatumType.relationships);
	predicates_table = this.base(DatumType.predicates);
	things_table = this.base(DatumType.things);
	access_table = this.base(DatumType.access);
	users_table = this.base(DatumType.users);
	dbType = DBType.airtable;
	hierarchy!: Hierarchy;
	baseID = k.empty;
	isRemote = true;
	hasData = false;
	loadTime = null;

	relationships_errorMessage = 'Error in Relationships:';
	setHasData(flag: boolean) { this.hasData = flag; }
	things_errorMessage = 'Error in Things:';
	async fetch_allFrom(baseID: string) {}
	queryStrings_apply() {}

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
		h.things_forgetAll(); // clear

		try {
			const select = this.things_table.select();
			await select.all().then((records) => {
				const remoteThings = records;
				for (const remoteThing of remoteThings) {
					const id = remoteThing.id;
					h.thing_remember_runtimeCreate(k.empty, id, remoteThing.fields.title as string, remoteThing.fields.color as string, remoteThing.fields.trait as string, true);
				}
				s_things_arrived.set(true);
			})
		} catch (error) {
			debug.log_error(this.things_errorMessage + ' (things_readAll) ' + error);
		}
	}

	static readonly $_THING_$: unique symbol;
	
	async thing_remember_remoteCreate(thing: Thing) {
		try {
			const fields = await this.things_table.create(thing.fields);
			const id = fields['id']; //	// need for update, delete and things_byHID (to get parent from relationship)
			thing.setID(id);
			thing.isRemotelyStored = true;
			h.thing_remember(thing);
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
			h.thing_forget(thing);		// do first so UX updates quickly
			await this.things_table.destroy(thing.id);
		} catch (error) {
			thing.log(DebugFlag.remote, this.things_errorMessage + error);
		}
	}

	static readonly $_RELATIONSHIPS_$: unique symbol;

	async relationships_readAll() {
		h.relationships_clearKnowns();
		try {
			const records = await this.relationships_table.select().all()

			for (const record of records) {
				const id = record.id as string;
				const order = record.fields.order as number;
				const parents = record.fields.parent as (Array<string>);
				const children = record.fields.child as (Array<string>);
				const predicates = record.fields.predicate as (Array<string>);
				h.relationship_remember_runtimeCreateUnique(k.empty, id, predicates[0], parents[0], children[0], order, CreationOptions.isFromRemote);
			}
		} catch (error) {
			debug.log_error(this.relationships_errorMessage + error);
		}
	}

	static readonly $_RELATIONSHIP_$: unique symbol;

	async relationship_remember_remoteCreate(relationship: Relationship | null) {
		if (relationship && !relationship.isRemotelyStored) {
			try {
				const fields = await this.relationships_table.create(relationship.fields);	// insert with temporary id
				const id = fields['id'];																										// grab permanent id
				relationship.setID(id);
				relationship.isRemotelyStored = true;
				h.relationships_refreshKnowns();
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
			h.relationships = u.strip_invalid(h.relationships);
			h.relationships_refreshKnowns(); // do first so UX updates quickly
			await this.relationships_table.destroy(relationship.id);
		} catch (error) {
			relationship.log(DebugFlag.remote, this.relationships_errorMessage + error);
		}
	}

	static readonly $_ANCILLARY_$: unique symbol;

	async predicates_readAll() {
		try {
			const records = await this.predicates_table.select().all()

			for (const record of records) {
				const fields = record.fields;
				const id = record.id as string; // do not yet need this
				const kind = fields.kind as string;
				const isBidirectional = fields.isBidirectional as boolean ?? false;
				h.predicate_remember_runtimeCreate(id, kind, isBidirectional);
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
				h.access_runtimeCreate(id, kind);
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
				h.user_runtimeCreate(id, record.fields.name as string, record.fields.email as string, record.fields.phone as string);
			}

		} catch (error) {
			debug.log_error('Error in Users:' + error);
		}
	}

}

export const dbAirtable = new DBAirtable();