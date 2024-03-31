import { g, k, u, get, Path, Datum, debug, IDTrait, Predicate, Relationship } from '../common/GlobalImports';
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
	
	get fields():	Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get isHere():			  boolean { return (get(s_path_here).thing?.id ?? '') == this.id; }
	get idBridging():		   string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get parents():		 Array<Thing> { return this.fromThingsFor(Predicate.idContains); }
	get parentPaths():	  Array<Path> { return this.fromPathsFor(Predicate.idContains); }
	get description():		   string { return this.id + ' \"' + this.title + '\"'; }
	get titleWidth():		   number { return u.getWidthOf(this.title) + 6; }
	get parentIDs():	Array<string> { return this.parents.map(t => t.id); }
	get hasMultipleParents(): boolean { return this.parentPaths.length > 1; }
	get isAcrossBulk():		  boolean { return this.baseID != g.hierarchy.db.baseID; }
	get isBulkAlias():		  boolean { return this.trait == IDTrait.bulk; }
	get isRoot():			  boolean { return this == g.root; }
	get hierarchy():		Hierarchy { return g.hierarchy; }

	get thing_isBulk_expanded(): boolean {
		// needed because cross db paths do not work quite right
		if (this.isBulkAlias) {
			const paths = get(s_paths_expanded);
			for (const path of paths) {
				if (this.id == path.thing?.id) {
					return true;
				}
			}
		}
		return false;
	}
	
	debugLog(message: string) { this.log(DebugFlag.things, message); }
	log(option: DebugFlag, message: string) { debug.log_maybe(option, message + k.space + this.description); }

	override isInDifferentBulkThan(other: Thing): boolean {
		return super.isInDifferentBulkThan(other) || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
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

	fromThingsFor(predicateID: string): Array<Thing> {
		let fromThings: Array<Thing> = [];
		if (!this.isRoot) {
			const relationships = this.relationships_onceFrom(predicateID);
			for (const relationship of relationships) {
				const thing = relationship.fromThing;
				if (thing) {
					fromThings.push(thing);
				}
			}
		}
		return fromThings;
	}

	relationships_onceFrom(predicateID: string): Array<Relationship> {
		return this.hierarchy.relationships_get_byPredicate_to_thing(predicateID, true, this.id);
	}

	fromPathsFor(predicateID: string): Array<Path> {
		let pathsByHID: {[hash: number]: Path} = {};
		if (!this.isRoot) {
			const relationships = this.relationships_onceFrom(predicateID);
			for (const relationship of relationships) {
				function addPath(path: Path) {
					const fullPath = path.appendID(endID);
					pathsByHID[fullPath.hashedPath] = fullPath;	
				}
				const endID = relationship.id;		// EGADS, this is the wrong relationship; needs the next one
				const fromThing = relationship.fromThing;
				const fromPaths = fromThing?.fromPathsFor(predicateID) ?? [];
				if (fromPaths.length == 0) {
					addPath(g.rootPath);
				} else {
					for (const fromPath of fromPaths) {
						addPath(fromPath);
					}
				}
			}
		}
		const paths = Object.values(pathsByHID);
		return u.sort_byTitleTop(paths).reverse();
	}
	
	fromPaths_uniquelyFor(predicateID: string): Array<Path> {
		if (this.isRoot) {
			return [];
		}
		const paths: Array<Path> = []
		const parents = this.parents ?? [];
		for (const parent of parents) {
			if (parent.isRoot) {
				paths.push(g.rootPath);
			} else {
				const relationships = g.hierarchy.relationships_get_byPredicate_to_thing(predicateID, true, parent.id);
				if (relationships.length > 0){
					paths.push(new Path(relationships[0].id, predicateID))
				}
			}
		}
		return paths.length > 0 ? paths : [g.rootPath];
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
