import { E_Database, E_Persistence } from './DBCommon';
import type { Dictionary } from '../common/Types';
import { k } from '../common/Global_Imports';
import DBCommon from './DBCommon';

export default class DBLocal extends DBCommon {
	e_persistence = E_Persistence.local;
	e_database = E_Database.local;
	idBase = k.id_base.local;
	
	get dict_forStorageDetails(): Dictionary { return {'data' : 'fast and local'} }
}

export const dbLocal = new DBLocal();