import { k, T_Persistence } from '../common/Global_Imports';
import { T_Database } from './DB_Common';
import DB_Common from './DB_Common';

export default class DB_Bubble extends DB_Common {
	t_persistence = T_Persistence.none;
	t_database = T_Database.bubble;
	idBase = k.empty;
}
