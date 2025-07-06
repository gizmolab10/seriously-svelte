import { T_Persistence } from '../common/Global_Imports';
import { k } from '../common/Global_Imports';
import { T_Database } from './DB_Common';
import DB_Common from './DB_Common';

export default class DB_Local extends DB_Common {
	t_persistence = T_Persistence.local;
	t_database = T_Database.local;
	idBase = k.id_base.local;
}
