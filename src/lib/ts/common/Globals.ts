import { Path, Thing, dbDispatch, Hierarchy } from '../../ts/common/GlobalImports';
import { s_db_type, s_path_here, s_paths_grabbed } from '../managers/State';

class Globals {
	titleIsAtTop: boolean = false;
	showControls: boolean = false;
	hierarchy: Hierarchy;
	rootPath: Path;
	herePath: Path;
	root: Thing;
	here: Thing;

	setup() {
		s_path_here.subscribe((path: Path) => {
			if (path) {
				this.herePath = path;
			}
		})
		s_db_type.subscribe((type: string) => {
			if (type && dbDispatch.db.dbType != type) {
				s_path_here.set(this.rootPath);
				s_paths_grabbed.set([]);
				dbDispatch.updateDBForType(type);
				dbDispatch.updateHierarchy(type);
			}
		});
	}
}

export let g = new Globals();
