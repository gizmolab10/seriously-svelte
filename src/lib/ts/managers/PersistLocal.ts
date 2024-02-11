import { s_path_here, s_row_height, s_paths_expanded, s_db_loadTime, s_title_atTop, s_paths_grabbed } from './State';
import { s_setup, s_showDetails, s_line_stretch, s_tools_inWidgets, s_user_graphOffset, s_thing_fontFamily } from './State';
import { k, Path, Point, dbDispatch } from '../common/GlobalImports'

export enum PersistID {
	tools_inWidgets	= 'tools_inWidgets',
	relationships	= 'relationships',
	line_stretch 	= 'line_stretch',
	title_atTop  	= 'title_atTop',
	row_height   	= 'row_height',
	expanded	 	= 'expanded',
	grabbed		 	= 'grabbed',
	details		 	= 'details',
	origin		 	= 'origin',
	here		 	= 'here',
	font		 	= 'font',
	db			 	= 'db',
}

class PersistLocal {
	usesRelationships = localStorage[PersistID.relationships];
	ignorePaths = !this.usesRelationships || this.usesRelationships == 'undefined';

	restore() {
		// localStorage.clear();
		// const isLocal = u.isServerLocal();
		// this.writeToKey(PersistID.row_height, 20);
		// this.writeToKey(PersistID.dot_size, 13);

		this.writeToKey(PersistID.title_atTop, false);
		this.writeToKey(PersistID.tools_inWidgets, false);
		if (this.ignorePaths) {
			this.writeToKey(PersistID.relationships, true);
		}
		s_db_loadTime.set(null);
		s_row_height.set(this.readFromKey(PersistID.row_height) ?? 20); // sets s_dot_size and s_thing_fontSize
		s_showDetails.set(this.readFromKey(PersistID.details) ?? false);
		s_line_stretch.set(this.readFromKey(PersistID.line_stretch) ?? 30);
		s_title_atTop.set(this.readFromKey(PersistID.title_atTop) ?? false);
		s_thing_fontFamily.set(this.readFromKey(PersistID.font) ?? 'Arial');
		s_user_graphOffset.set(this.readFromKey(PersistID.origin) ?? new Point());
		s_tools_inWidgets.set(this.readFromKey(PersistID.tools_inWidgets) ?? false);
	}

	paths_restore() {
		const hierarchy = dbDispatch.db.hierarchy;
		const idHere = this.ignorePaths ? '' : (this.readFromDBKey(PersistID.here) ?? hierarchy.idRoot);
		s_paths_grabbed.set(this.ignorePaths ? [] : this.readFromDBKey(PersistID.grabbed)?.map((s: string) => hierarchy.path_unique(s)) ?? []);
		s_paths_expanded.set(this.ignorePaths ? [] : this.readFromDBKey(PersistID.expanded)?.map((e: string) => hierarchy.path_unique(e)) ?? []);
		s_path_here.set(hierarchy.path_unique(idHere));
		k.rootPath = hierarchy.path_unique();
		k.rootPath.setup();
		s_setup();

		s_path_here.subscribe((path: Path) => {
			if (path) {
				this.writeToDBKey(PersistID.here, path.pathString);
			}
		});

		s_paths_grabbed.subscribe((paths: Array<Path>) => {
			this.writeToDBKey(PersistID.grabbed, paths.map(p => p.pathString));
		});

		s_paths_expanded.subscribe((paths: Array<Path>) => {
			this.writeToDBKey(PersistID.expanded, paths.map(p => p.pathString));
		});
	}

	get dbType(): string { return dbDispatch.db.dbType; }
	readFromDBKey(key: string) { return this.readFromKey(key + this.dbType); }
	writeToDBKey(key: string, value: any) { this.writeToKey(key + this.dbType, value); }
	writeToKey(key: string, value: any) { localStorage[key] = JSON.stringify(value); }

	readFromKey(key: string): any | null {
		const storedValue = localStorage[key];
		if (!storedValue || storedValue == 'undefined') {
			return null;
		} else {
			return JSON.parse(storedValue);
		} 
	}

}

export const persistLocal = new PersistLocal();
