import { graphOffset, showDetails, lineStretch, titleFontSize, titleFontFamily } from './State';
import { idHere, lineGap, expanded, dbLoadTime, dotDiameter, idsGrabbed } from './State';
import { get, Point, dbDispatch } from '../common/GlobalImports'

export enum PersistID {
	lineStretch = 'lineStretch',
	dotDiameter	= 'dotDiameter',
	expanded	= 'expanded',
	fontSize	= 'fontSize',
	grabbed		= 'grabbed',
	details		= 'details',
	origin		= 'origin',
	here		= 'here',
	font		= 'font',
	gap			= 'gap',
	db			= 'db',
}

class PersistLocal {
	keySeparator = '|';
	valueSeparator = ':';
	okayToPersist = false;

	restore() {
		// localStorage.clear();
		// const isLocal = isServerLocal();
		dbLoadTime.set(null);
		this.writeToKey(PersistID.lineStretch, 30);
		lineGap.set(this.readFromKey(PersistID.gap) ?? 30);
		idHere.set(this.readFromDBKey(PersistID.here));
		showDetails.set(this.readFromKey(PersistID.details) ?? false);
		titleFontSize.set(this.readFromKey(PersistID.fontSize) ?? 14);
		dotDiameter.set(this.readFromKey(PersistID.dotDiameter) ?? 14);
		lineStretch.set(this.readFromKey(PersistID.lineStretch) ?? 30);
		titleFontFamily.set(this.readFromKey(PersistID.font) ?? 'Arial');
		expanded.set(this.readFromDBKey(PersistID.expanded) ?? []);
		idsGrabbed.set(this.readFromDBKey(PersistID.grabbed) ?? []);
		graphOffset.set(this.readFromKey(PersistID.origin) ?? new Point());
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
	writeToKey(key: string, value: any) { localStorage.setItem(key, JSON.stringify(value)); }

	readFromKey(key: string): any | null {
		const storedValue = localStorage.getItem(key);
		return (storedValue == 'undefined') ? null : JSON.parse(storedValue!);
	}

	state_updateFor(type: string, defaultIDHere: string) {
		const hID = this.readFromKey(PersistID.here + type) ?? defaultIDHere;
		const gIDs = this.readFromKey(PersistID.grabbed + type) ?? [defaultIDHere];
		this.okayToPersist = false;
		idHere.set(hID);
		idsGrabbed.set(gIDs);
		this.okayToPersist = true;
	}

}

export const persistLocal = new PersistLocal();
