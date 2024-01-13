import { user_graphOffset, showDetails, line_stretch, thing_fontFamily } from './State';
import { path_here, row_height, paths_expanded, db_loadTime, paths_grabbed } from './State';
import { Path, Point, dbDispatch } from '../common/GlobalImports'

export enum PersistID {
	line_stretch = 'line_stretch',
	row_height	 = 'row_height',
	expanded	 = 'expanded',
	grabbed		 = 'grabbed',
	details		 = 'details',
	select		 = 'select',
	origin		 = 'origin',
	here		 = 'here',
	font		 = 'font',
	db			 = 'db',
}

class PersistLocal {
	okayToPersist = false;

	restore() {
		// localStorage.clear();
		// const isLocal = isServerLocal();

		// this.writeToKey(PersistID.row_height, 20);
		// this.writeToKey(PersistID.dot_size, 13);

		const id = this.readFromDBKey(PersistID.here);
		db_loadTime.set(null);
		path_here.set(!id ? null : new Path(id));
		row_height.set(this.readFromKey(PersistID.row_height) ?? 20); // sets dot_size and thing_fontSize
		showDetails.set(this.readFromKey(PersistID.details) ?? false);
		line_stretch.set(this.readFromKey(PersistID.line_stretch) ?? 30);
		thing_fontFamily.set(this.readFromKey(PersistID.font) ?? 'Arial');
		user_graphOffset.set(this.readFromKey(PersistID.origin) ?? new Point());
		paths_grabbed.set(this.readFromDBKey(PersistID.grabbed)?.map((s: string) => new Path(s)) ?? []);
		paths_expanded.set(this.readFromDBKey(PersistID.expanded)?.map((e: string) => new Path(e)) ?? []);


		paths_grabbed.subscribe((paths: Array<Path>) => {
			if (this.okayToPersist) {
				this.writeToDBKey(PersistID.grabbed, paths.map(p => p.pathString));
			}
		});

		paths_expanded.subscribe((paths: Array<Path>) => {
			if (this.okayToPersist) {
				this.writeToDBKey(PersistID.expanded, paths.map(p => p.pathString));
			}
		});

		path_here.subscribe((path: Path | null) => {
			if (this.okayToPersist && path) {
				this.writeToDBKey(PersistID.here, path.pathString);
			}
		});
	}

	get db_type(): string { return dbDispatch.db.db_type; }
	readFromDBKey(key: string) { return this.readFromKey(key + this.db_type); }
	writeToDBKey(key: string, value: any) { this.writeToKey(key + this.db_type, value); }
	writeToKey(key: string, value: any) { localStorage[key] = JSON.stringify(value); }

	readFromKey(key: string): any | null {
		const storedValue = localStorage[key];
		if (!storedValue || storedValue == 'undefined') {
			return null;
		} else {
			return JSON.parse(storedValue);
		} 
	}

	state_updateForDBType(db_type: string, defaultpath_here: string) {
		this.okayToPersist = false; // avoid infinite recursion (above for path_here & paths_grabbed)

		const hereID = this.readFromKey(PersistID.here + db_type) ?? defaultpath_here;
		const grabbedIDs = this.readFromKey(PersistID.grabbed + db_type) ?? [defaultpath_here];
		path_here.set(new Path(hereID));
		paths_grabbed.set(grabbedIDs.map((id: string) => new Path(id)));

		this.okayToPersist = true;
	}

}

export const persistLocal = new PersistLocal();
