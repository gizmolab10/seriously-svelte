import { T_Database, T_Persistence } from './DBCommon';
import type { Dictionary } from '../common/Types';
import { k } from '../common/Global_Imports';
import DBCommon from './DBCommon';

export default class DBLocal extends DBCommon {
	kind_persistence = T_Persistence.local;
	t_database = T_Database.local;
	idBase = k.id_base.local;
	
	get dict_forStorageDetails(): Dictionary { return {'data' : 'fast and local'} }
}

export const dbLocal = new DBLocal();