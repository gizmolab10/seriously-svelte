import { T_Persistence } from '../common/Global_Imports';
import type { Dictionary } from '../common/Types';
import { k } from '../common/Global_Imports';
import { T_Database } from './DBCommon';
import DBCommon from './DBCommon';

export default class DBLocal extends DBCommon {
	t_persistence = T_Persistence.local;
	t_database = T_Database.local;
	idBase = k.id_base.local;
	
	get dict_forStorageDetails(): Dictionary { return {'data' : 'fast and local'} }
}
