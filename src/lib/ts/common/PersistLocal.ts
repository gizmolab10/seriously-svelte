import { dbType, bulkName, expanded, graphOffset, showDetails, lineStretch, dbLoadTime, dotDiameter, lineGap } from '../managers/State';
import { DBType, Point } from './GlobalImports'

export enum BulkID {
	public = 'Public',
	mine	= 'Jonathan Sand',
}

export enum PersistID {
	lineStretch = 'stretch',
	expanded	= 'expanded',
	details		= 'details',
	origin		= 'origin',
	bulk		= 'bulk',
	here		= 'here',
	grab		= 'grab',
	gap			= 'gap',
	dot			= 'dot',
	db			= 'db',
}

class PersistLocal {
	idSeparator = ':';
	separator = '|';

	start() {
		// localStorage.clear();
		// const isLocal = isServerLocal();
		dbLoadTime.set(null);
		lineGap. set(this.readFromKey(PersistID.gap) ?? 30);
		dotDiameter.set(this.readFromKey(PersistID.dot) ?? 14);
		expanded.set(this.readFromKey(PersistID.expanded) ?? []);
		showDetails.set(this.readFromKey(PersistID.details) ?? false);
		lineStretch.set(this.readFromKey(PersistID.lineStretch) ?? 40);
		bulkName.set(this.readFromKey(PersistID.bulk) ?? BulkID.public);
		graphOffset.set(this.readFromKey(PersistID.origin) ?? new Point());
		dbType.set(this.readFromKey(PersistID.db) ?? DBType.firebase); // invokes cloud setup, which needs bulk name already set (must be above)
	}

	readFromKey(aKey: string): any | null {
		const storedValue = localStorage.getItem(aKey);
		return storedValue ? JSON.parse(storedValue) : null;
	}

	readFromKeys(aKey: string, bKey: string) {
		let values = this.readFromKey(aKey + this.separator + bKey)?.split(this.separator);
		if (values) {
			values[1] = values[1].split(this.idSeparator);
		}
		return values;
	}

	writeToKey(aKey: string, value: any) {
		localStorage.setItem(aKey, JSON.stringify(value));
	}

	writeToKeys(aKey: string, aValue: any, bKey: string, bValues: Array<any>) {
		if (aValue && bValues.length > 0) {
			this.writeToKey(aKey + this.separator + bKey, aValue + this.separator + bValues.join(this.idSeparator));
		}
	}

}

export const persistLocal = new PersistLocal();
