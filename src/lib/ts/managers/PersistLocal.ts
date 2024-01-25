import { s_path_here, s_row_height, s_paths_expanded, s_db_loadTime, s_title_atTop, s_paths_grabbed } from './State';
import { s_user_graphOffset, s_showDetails, s_line_stretch, s_thing_fontFamily } from './State';
import { Path, Point, dbDispatch } from '../common/GlobalImports'

export enum PersistID {
	relationships = 'relationships',
	line_stretch  = 'line_stretch',
	title_atTop   = 'title_atTop',
	row_height    = 'row_height',
	expanded	  = 'expanded',
	grabbed		  = 'grabbed',
	details		  = 'details',
	origin		  = 'origin',
	here		  = 'here',
	font		  = 'font',
	db			  = 'db',
}

class PersistLocal {
	okayToPersist = false;
	usesRelationships = localStorage[PersistID.relationships];
	ignorePaths = !this.usesRelationships || this.usesRelationships == 'undefined';

	restore() {
		// localStorage.clear();
		// const isLocal = u.isServerLocal();
		// this.writeToKey(PersistID.row_height, 20);
		// this.writeToKey(PersistID.dot_size, 13);

		this.writeToKey(PersistID.title_atTop, false);
		if (this.ignorePaths) {
			this.writeToKey(PersistID.relationships, true);
		}
		const id = this.ignorePaths ? '' : this.readFromDBKey(PersistID.here);
		s_db_loadTime.set(null);
		s_path_here.set(dbDispatch.db.hierarchy.uniquePath(id));
		s_row_height.set(this.readFromKey(PersistID.row_height) ?? 20); // sets s_dot_size and s_thing_fontSize
		s_showDetails.set(this.readFromKey(PersistID.details) ?? false);
		s_line_stretch.set(this.readFromKey(PersistID.line_stretch) ?? 30);
		s_title_atTop.set(this.readFromKey(PersistID.title_atTop) ?? false);
		s_thing_fontFamily.set(this.readFromKey(PersistID.font) ?? 'Arial');
		s_user_graphOffset.set(this.readFromKey(PersistID.origin) ?? new Point());
		s_paths_grabbed.set(this.ignorePaths ? [] : this.readFromDBKey(PersistID.grabbed)?.map((s: string) => dbDispatch.db.hierarchy.uniquePath(s)) ?? []);
		s_paths_expanded.set(this.ignorePaths ? [] : this.readFromDBKey(PersistID.expanded)?.map((e: string) => dbDispatch.db.hierarchy.uniquePath(e)) ?? []);

		s_paths_grabbed.subscribe((paths: Array<Path>) => {
			if (this.okayToPersist) {
				this.writeToDBKey(PersistID.grabbed, paths.map(p => p.pathString));
			}
		});

		s_paths_expanded.subscribe((paths: Array<Path>) => {
			if (this.okayToPersist) {
				this.writeToDBKey(PersistID.expanded, paths.map(p => p.pathString));
			}
		});

		s_path_here.subscribe((path: Path) => {
			if (this.okayToPersist && path) {
				this.writeToDBKey(PersistID.here, path.pathString);
			}
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

	s_updateForDBType(dbType: string) {
		this.okayToPersist = false; // avoid infinite recursion (above for s_path_here & s_paths_grabbed)

		const hereID = this.ignorePaths ? '' : this.readFromKey(PersistID.here + dbType) ?? '';
		const grabbedIDs = this.ignorePaths ? [] : this.readFromKey(PersistID.grabbed + dbType) ?? [''];
		s_path_here.set(dbDispatch.db.hierarchy.uniquePath(hereID));
		s_paths_grabbed.set(grabbedIDs.map((id: string) => dbDispatch.db.hierarchy.uniquePath(id)));

		this.okayToPersist = true;
	}

}

export const persistLocal = new PersistLocal();
