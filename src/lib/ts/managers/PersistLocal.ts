import { graphOffset, showDetails, lineStretch, thingFontSize, thingFontFamily } from './State';
import { idHere, lineGap, dotSize, expanded, dbLoadTime, idsGrabbed } from './State';
import { get, Point, dbDispatch } from '../common/GlobalImports'

export enum PersistID {
	lineStretch = 'lineStretch',
	expanded	= 'expanded',
	fontSize	= 'fontSize',
	dotSize		= 'dotSize',
	grabbed		= 'grabbed',
	details		= 'details',
	origin		= 'origin',
	here		= 'here',
	font		= 'font',
	gap			= 'gap',
	db			= 'db',
}

class PersistLocal {
	okayToPersist = false;

	restore() {
		// localStorage.clear();
		// const isLocal = isServerLocal();
		dbLoadTime.set(null);
		this.writeToKey(PersistID.dotSize, 16);
		idHere.set(this.readFromDBKey(PersistID.here));
		lineGap.set(this.readFromKey(PersistID.gap) ?? 30);
		const size = this.readFromKey(PersistID.dotSize) ?? 16;
		expanded.set(this.readFromDBKey(PersistID.expanded) ?? []);
		idsGrabbed.set(this.readFromDBKey(PersistID.grabbed) ?? []);
		showDetails.set(this.readFromKey(PersistID.details) ?? false);
		lineStretch.set(this.readFromKey(PersistID.lineStretch) ?? 30);
		thingFontFamily.set(this.readFromKey(PersistID.font) ?? 'Arial');
		graphOffset.set(this.readFromKey(PersistID.origin) ?? new Point());
		thingFontSize.set(size - 2);
		dotSize.set(size);
		idsGrabbed.subscribe((ids: Array<string>) => {
			if (this.okayToPersist) {
				const here = dbDispatch.db.hierarchy.here;
				if (ids && here) {
					this.writeToDBKey(PersistID.grabbed, get(idsGrabbed));
				}
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
