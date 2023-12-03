import { user_graphOffset, showDetails, line_stretch, thing_fontFamily } from './State';
import { id_here, line_gap, expanded, db_loadTime, ids_grabbed } from './State';
import { Point, dbDispatch } from '../common/GlobalImports'

export enum PersistID {
	line_stretch = 'line_stretch',
	line_gap	 = 'line_gap',
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

		// this.writeToKey(PersistID.line_gap, 20);
		// this.writeToKey(PersistID.dot_size, 13);

		db_loadTime.set(null);
		id_here.set(this.readFromDBKey(PersistID.here));
		line_gap.set(this.readFromKey(PersistID.line_gap) ?? 20); // sets dot_size and thing_fontSize
		expanded.set(this.readFromDBKey(PersistID.expanded) ?? []);
		ids_grabbed.set(this.readFromDBKey(PersistID.grabbed) ?? []);
		showDetails.set(this.readFromKey(PersistID.details) ?? false);
		line_stretch.set(this.readFromKey(PersistID.line_stretch) ?? 30);
		thing_fontFamily.set(this.readFromKey(PersistID.font) ?? 'Arial');
		user_graphOffset.set(this.readFromKey(PersistID.origin) ?? new Point());

		ids_grabbed.subscribe((ids: string[]) => {
			const here = dbDispatch.db.hierarchy.here;
			if (this.okayToPersist && here) {
				this.writeToDBKey(PersistID.grabbed, ids);
			}
		});
	}

	get db_type(): string { return dbDispatch.db.db_type; }
	readFromDBKey(key: string) { return this.readFromKey(key + this.db_type); }
	writeToDBKey(key: string, value: any) { this.writeToKey(key + this.db_type, value); }
	writeToKey(key: string, value: any) { localStorage[key] = JSON.stringify(value); }

	readFromKey(key: string): any | null {
		const storedValue = localStorage[key];
		return !storedValue ? null : JSON.parse(storedValue!);
	}

	state_updateForDBType(db_type: string, defaultid_here: string) {
		const hereID = this.readFromKey(PersistID.here + db_type) ?? defaultid_here;
		const grabbedIDs = this.readFromKey(PersistID.grabbed + db_type) ?? [defaultid_here];
		this.okayToPersist = false;
		id_here.set(hereID);
		ids_grabbed.set(grabbedIDs);
		this.okayToPersist = true;
	}

}

export const persistLocal = new PersistLocal();
