import { user_graphOffset, showDetails, lineStretch, thingFontFamily } from './State';
import { idHere, lineGap, expanded, dbLoadTime, idsGrabbed } from './State';
import { Point, dbDispatch } from '../common/GlobalImports'

export enum PersistID {
	lineStretch = 'lineStretch',
	expanded	= 'expanded',
	lineGap		= 'lineGap',
	grabbed		= 'grabbed',
	details		= 'details',
	select		= 'select',
	origin		= 'origin',
	here		= 'here',
	font		= 'font',
	db			= 'db',
}

class PersistLocal {
	okayToPersist = false;

	restore() {
		// localStorage.clear();
		// const isLocal = isServerLocal();

		// this.writeToKey(PersistID.lineGap, 20);
		// this.writeToKey(PersistID.dotSize, 13);

		dbLoadTime.set(null);
		idHere.set(this.readFromDBKey(PersistID.here));
		lineGap.set(this.readFromKey(PersistID.lineGap) ?? 20); // sets dotSize and thingFontSize
		expanded.set(this.readFromDBKey(PersistID.expanded) ?? []);
		idsGrabbed.set(this.readFromDBKey(PersistID.grabbed) ?? []);
		showDetails.set(this.readFromKey(PersistID.details) ?? false);
		lineStretch.set(this.readFromKey(PersistID.lineStretch) ?? 30);
		thingFontFamily.set(this.readFromKey(PersistID.font) ?? 'Arial');
		user_graphOffset.set(this.readFromKey(PersistID.origin) ?? new Point());

		idsGrabbed.subscribe((ids: string[]) => {
			const here = dbDispatch.db.hierarchy.here;
			if (this.okayToPersist && here) {
				this.writeToDBKey(PersistID.grabbed, ids);
			}
		});
	}

	get dbType(): string { return dbDispatch.db.dbType; }
	readFromDBKey(key: string) { return this.readFromKey(key + this.dbType); }
	writeToDBKey(key: string, value: any) { this.writeToKey(key + this.dbType, value); }
	writeToKey(key: string, value: any) { localStorage[key] = JSON.stringify(value); }

	readFromKey(key: string): any | null {
		const storedValue = localStorage[key];
		return !storedValue ? null : JSON.parse(storedValue!);
	}

	state_updateForDBType(dbType: string, defaultIDHere: string) {
		const hereID = this.readFromKey(PersistID.here + dbType) ?? defaultIDHere;
		const grabbedIDs = this.readFromKey(PersistID.grabbed + dbType) ?? [defaultIDHere];
		this.okayToPersist = false;
		idHere.set(hereID);
		idsGrabbed.set(grabbedIDs);
		this.okayToPersist = true;
	}

}

export const persistLocal = new PersistLocal();
