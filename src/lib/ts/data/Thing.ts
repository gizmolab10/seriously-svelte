import { g, k, u, get, Path, Datum, debug, IDTrait, Predicate } from '../common/GlobalImports';
import { Hierarchy, DebugFlag, dbDispatch, SeriouslyRange } from '../common/GlobalImports';
import { s_path_here, s_paths_expanded } from '../common/State';
import Airtable from 'airtable';

export default class Thing extends Datum {
	selectionRange = new SeriouslyRange(0, 0);
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

	constructor(baseID: string, id: string | null, title = k.title_default, color = 'blue', trait = 's', isRemotelyStored: boolean) {
		super(baseID, id, isRemotelyStored);
		this.selectionRange = new SeriouslyRange(0, title.length);
		this.dbType = dbDispatch.db.dbType;
		this.title = title;
		this.color = color;
		this.trait = trait;
	};
	
	get idSmart():			   string { return this.isBulkAlias ? this.bulkRootID : this.id; }		// can straddle base ids
	get fields():	Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get isHere():			  boolean { return (get(s_path_here).thing?.id ?? '') == this.id; }
	get parentPaths():	  Array<Path> { return this.fromPathsFor(Predicate.idContains); }
	get parents():		 Array<Thing> { return this.things_fromPaths(this.parentPaths); }
	get description():		   string { return this.id + ' \"' + this.title + '\"'; }
	get titleWidth():		   number { return u.getWidthOf(this.title) + 6; }
	get parentIDs():	Array<string> { return this.parents.map(t => t.id); }
	get hasMultipleParents(): boolean { return this.parentPaths.length > 1; }
	get isBulkAlias():		  boolean { return this.trait == IDTrait.bulk; }
	get isRoot():			  boolean { return this == g.root; }
	get hierarchy():		Hierarchy { return g.hierarchy; }

	get thing_isBulk_expanded(): boolean {
		if (this.isBulkAlias) {
			for (const path of get(s_paths_expanded)) {
				if (this.id == path.thing?.id) {
					return true;
				}
			}
		}
		return false;
	}
	
	debugLog(message: string) { this.log(DebugFlag.things, message); }
	log(option: DebugFlag, message: string) { debug.log_maybe(option, message + k.space + this.description); }

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

	crumbWidth(numberOfParents: number): number {
		const none = this.titleWidth + 10;
		const one = none + 11;
		const multiple = one + 7;
		switch (numberOfParents) {
			case 0: return none;
			case 1: return one;
			default: return multiple;
		}
	}

	fromPathsFor(predicateID: string): Array<Path> {
		let fromPaths: {[hash: number]: Path} = {};
		if (!this.isRoot) {
			const relationships = this.hierarchy.relationships_get_byPredicate_to_thing(predicateID, true, this.id);
			for (const relationship of relationships) {
				const endID = relationship.id;
				const thing = relationship.fromThing;
				const paths = thing?.fromPathsFor(predicateID) ?? [];
				function addPath(path: Path) {
					const fullPath = path.appendID(endID);
					fromPaths[fullPath.hashedPath] = fullPath;	
				}
				if (paths.length == 0) {
					addPath(g.rootPath);
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

	updateColorAttributes(path: Path) {
		const border = (path.isEditing ? 'dashed' : 'solid') + ' 1px ';
		const hover = border + path.dotColor(true);
		const grab = border + path.dotColor(false);
		this.borderAttribute = border;
		this.hoverAttributes = hover;
		this.grabAttributes = grab;
	}

}
