import { Hierarchy, DebugFlag, IDTrait, dbDispatch } from '../common/GlobalImports';
import { k, u, get, Path, Datum, debug, Predicate } from '../common/GlobalImports';
import { s_dot_size, s_path_here } from '../managers/State';
import Airtable from 'airtable';

export default class Thing extends Datum {
	bulkRootID: string = '';
	needsBulkFetch = false;
	hoverAttributes = '';
	borderAttribute = '';
	grabAttributes = '';
	isExemplar = false;
	isEditing = false;
	isGrabbed = false;
	dbType: string;
	title: string;
	color: string;
	trait: string;

	constructor(baseID: string, id: string | null, title = k.defaultTitle, color = 'blue', trait = 's', isRemotelyStored: boolean) {
		super(baseID, id, isRemotelyStored);
		this.dbType = dbDispatch.db.dbType;
		this.title = title;
		this.color = color;
		this.trait = trait;
	};
	
	get parents():		 Array<Thing> { return this.things_fromPaths(this.fromPathsFor(Predicate.idIsAParentOf)); }
	get fields():	Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get isHere():			  boolean { return (get(s_path_here).thing?.id ?? '') == this.id; }
	get idForChildren():	   string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get parentPaths():	  Array<Path> { return this.fromPathsFor(Predicate.idIsAParentOf); }
	get description():		   string { return this.id + ' \"' + this.title + '\"'; }
	get parentIDs():	Array<string> { return this.parents.map(t => t.id); }
	get isRoot():			  boolean { return this == this.hierarchy.root; }
	get isBulkAlias():		  boolean { return this.trait == IDTrait.bulk; }
	get titleWidth():		   number { return u.getWidthOf(this.title) }
	get hierarchy():		Hierarchy { return k.hierarchy; }

	get crumbWidth(): number {
		const dotSize = get(s_dot_size);
		const numberOfParents = this.parentPaths.length;
		switch (numberOfParents) {
			case 0: return this.titleWidth;
			case 1: return this.titleWidth + dotSize * 1.6;
			default: return this.titleWidth + dotSize * 2.4;
		}
	}
	
	debugLog(message: string) { this.log(DebugFlag.things, message); }
	log(option: DebugFlag, message: string) { debug.log_maybe(option, message + ' ' + this.description); }
	thing_isInDifferentBulkThan(other: Thing) {
		return this.baseID != other.baseID || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
	}

	things_fromPaths(paths: Array<Path>): Array<Thing> {
		let fromThings: { [id: string]: Thing} = {};
		for (const fromPath of paths) {
			const fromThing = fromPath.thingAt(2);
			if (fromThing) {
				fromThings[fromThing.id] = fromThing;
			}
		}
		return Object.values(fromThings);
	}

	fromPathsFor(predicateID: string): Array<Path> {
		let fromPaths: {[hash: number]: Path} = {};
		if (!this.isRoot) {
			const relationships = this.hierarchy.relationships_getByPredicateIDToAndID(predicateID, true, this.id);
			for (const relationship of relationships) {
				const endID = relationship.id;
				const thing = relationship.fromThing;
				const paths = thing?.fromPathsFor(predicateID) ?? [];
				function addPath(path: Path) {
					const fullPath = path.appendID(endID);
					fromPaths[fullPath.hashedPath] = fullPath;	
				}
				if (paths.length == 0) {
					addPath(k.rootPath);
				} else {
					for (const path of paths) {
						addPath(path);
					}
				}
			}
		}
		const paths = Object.values(fromPaths);
		return u.sort_byTitleTop(paths).reverse();
	}

	revealColor(isReveal: boolean, path: Path): string {
		const showBorder = path.isGrabbed || path.isEditing || this.isExemplar;
		const useThingColor = isReveal != showBorder;
		return useThingColor ? this.color : k.backgroundColor;
	}

	updateColorAttributes(path: Path) {
		const border = (path.isEditing ? 'dashed' : 'solid') + ' 1px ';
		const hover = border + this.revealColor(true, path);
		const grab = border + this.revealColor(false, path);
		this.borderAttribute = border;
		this.hoverAttributes = hover;
		this.grabAttributes = grab;
	}

}
