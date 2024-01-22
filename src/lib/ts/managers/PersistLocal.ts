import { s_user_graphOffset, s_showDetails, s_line_stretch, s_thing_fontFamily } from './State';
import { s_path_here, s_row_height, s_paths_expanded, s_db_loadTime, s_paths_grabbed } from './State';
import { Path, Point, dbDispatch } from '../common/GlobalImports'

export enum PersistID {
	relationships = 'relationships',
	line_stretch  = 'line_stretch',
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
		if (this.ignorePaths) {
			this.writeToKey(PersistID.relationships, true);
		}

		// localStorage.clear();
		// const isLocal = isServerLocal();

		// this.writeToKey(PersistID.row_height, 20);
		// this.writeToKey(PersistID.dot_size, 13);

		const id = this.ignorePaths ? '' : this.readFromDBKey(PersistID.here);
		s_db_loadTime.set(null);
		s_path_here.set(new Path(id));
		s_row_height.set(this.readFromKey(PersistID.row_height) ?? 20); // sets s_dot_size and s_thing_fontSize
		s_showDetails.set(this.readFromKey(PersistID.details) ?? false);
		s_line_stretch.set(this.readFromKey(PersistID.line_stretch) ?? 30);
		s_thing_fontFamily.set(this.readFromKey(PersistID.font) ?? 'Arial');
		s_user_graphOffset.set(this.readFromKey(PersistID.origin) ?? new Point());
		s_paths_grabbed.set(this.ignorePaths ? [] : this.readFromDBKey(PersistID.grabbed)?.map((s: string) => new Path(s)) ?? []);
		s_paths_expanded.set(this.ignorePaths ? [] : this.readFromDBKey(PersistID.expanded)?.map((e: string) => new Path(e)) ?? []);

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

	get s_db_type(): string { return dbDispatch.db.s_db_type; }
	readFromDBKey(key: string) { return this.readFromKey(key + this.s_db_type); }
	writeToDBKey(key: string, value: any) { this.writeToKey(key + this.s_db_type, value); }
	writeToKey(key: string, value: any) { localStorage[key] = JSON.stringify(value); }

	readFromKey(key: string): any | null {
		const storedValue = localStorage[key];
		if (!storedValue || storedValue == 'undefined') {
			return null;
		} else {
			return JSON.parse(storedValue);
		} 
	}

	s_updateForDBType(s_db_type: string) {
		this.okayToPersist = false; // avoid infinite recursion (above for s_path_here & s_paths_grabbed)

		const hereID = this.ignorePaths ? '' : this.readFromKey(PersistID.here + s_db_type) ?? '';
		const grabbedIDs = this.ignorePaths ? [] : this.readFromKey(PersistID.grabbed + s_db_type) ?? [''];
		s_path_here.set(new Path(hereID));
		s_paths_grabbed.set(grabbedIDs.map((id: string) => new Path(id)));

		this.okayToPersist = true;
	}

}

export const persistLocal = new PersistLocal();
