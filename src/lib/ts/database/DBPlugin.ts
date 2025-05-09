import { k, Thing, Trait, Hierarchy, Predicate, Relationship } from '../common/Global_Imports';
import { E_Database, E_Persistence } from './DBCommon';
import DBCommon from './DBCommon';

export default class DBPlugin extends DBCommon {
	kind_persistence = E_Persistence.none;
	e_database = E_Database.plugin;
	idBase = k.empty;
}

export const dbPlugin = new DBPlugin();