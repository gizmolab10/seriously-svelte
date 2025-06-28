import { k, Thing, Trait, Hierarchy, Predicate, Relationship } from '../common/Global_Imports';
import { T_Database, T_Persistence } from './DB_Common';
import DB_Common from './DB_Common';

export default class DB_Plugin extends DB_Common {
	t_persistence = T_Persistence.none;
	t_database = T_Database.plugin;
	idBase = k.empty;
}

export const dbPlugin = new DB_Plugin();