import { k, Thing, Trait, Hierarchy, Predicate, Relationship } from '../common/Global_Imports';
import { T_Database, T_Persistence } from './DBCommon';
import DBCommon from './DBCommon';

export default class DBPlugin extends DBCommon {
	kind_persistence = T_Persistence.none;
	t_database = T_Database.plugin;
	idBase = k.empty;
}

export const dbPlugin = new DBPlugin();