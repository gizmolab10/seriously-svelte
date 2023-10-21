import { lineGap, expanded, titleFontSize, titleFontFamily, graphOffset, showDetails, lineStretch, dbLoadTime, dotDiameter } from '../managers/State';
import { Point, dbDispatch } from './GlobalImports'

export enum PersistID {
	lineStretch = 'lineStretch',
	dotDiameter	= 'dotDiameter',
	expanded	= 'expanded',
	fontSize	= 'fontSize',
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

	restore() {
		// localStorage.clear();
		// const isLocal = isServerLocal();
		dbLoadTime.set(null);
		persistLocal.writeToKey(PersistID.lineStretch, 30);
		lineGap. set(this.readFromKey(PersistID.gap) ?? 30);
		showDetails.set(this.readFromKey(PersistID.details) ?? false);
		dotDiameter.set(this.readFromKey(PersistID.dotDiameter) ?? 14);
		lineStretch.set(this.readFromKey(PersistID.lineStretch) ?? 25);
		titleFontFamily.set(this.readFromKey(PersistID.font) ?? 'Arial');
		titleFontSize.set(this.readFromKey(PersistID.fontSize) ?? 14);
		graphOffset.set(this.readFromKey(PersistID.origin) ?? new Point());
		expanded.set(this.readFromKey(PersistID.expanded + dbDispatch.db.dbType) ?? []); // must be after dbType is set
	}

	readFromKey(key: string): any | null {
		const storedValue = localStorage.getItem(key);
		return storedValue ? JSON.parse(storedValue) : null;
	}

	readFromKeys(aKey: string, bKey: string) {
		let values = this.readFromKey(aKey + this.keySeparator + bKey)?.split(this.keySeparator);
		if (values) {
			values[1] = values[1].split(this.valueSeparator);
		}
		return values;
	}

	writeToKey(key: string, value: any) {
		localStorage.setItem(key, JSON.stringify(value));
	}

	writeToKeys(aKey: string, aValue: any, bKey: string, bValues: Array<any>) {
		if (aValue && bValues.length > 0) {
			this.writeToKey(aKey + this.keySeparator + bKey, aValue + this.keySeparator + bValues.join(this.valueSeparator));
		}
	}

}

export const persistLocal = new PersistLocal();
