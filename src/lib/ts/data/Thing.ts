import { g, k, u, get, Path, Datum, debug, IDTrait, Predicate, Relationship } from '../common/GlobalImports';
import { Hierarchy, DebugFlag, dbDispatch, SeriouslyRange } from '../common/GlobalImports';
import { s_path_here, s_paths_expanded } from '../common/State';
import Airtable from 'airtable';

export default class Thing extends Datum {
	selectionRange = new SeriouslyRange(0, 0);
	bulkRootID: string = k.empty;
	needsBulkFetch = false;
	hoverAttributes = k.empty;
	borderAttribute = k.empty;
	grabAttributes = k.empty;
	isExemplar = false;
	isEditing = false;
	isGrabbed = false;
	dbType: string;
	title: string;
	color: string;
	trait: string;

	constructor(baseID: string, id: string | null, title = k.title_default, color = k.color_default, trait = 's', isRemotelyStored: boolean) {
		super(baseID, id, isRemotelyStored);
		this.selectionRange = new SeriouslyRange(0, title.length);
		this.dbType = dbDispatch.db.dbType;
		this.title = title;
		this.color = color;
		this.trait = trait;
	};
	
	get parentIDs():	Array<string> { return this.parents.map(t => t.id); }
	get parentPaths():	  Array<Path> { return this.paths_fromFor(Predicate.idContains); }
	get parents():		 Array<Thing> { return this.things_fromFor(Predicate.idContains); }
	get fields():	Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get idBridging():		   string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get description():		   string { return this.id + ' \"' + this.title + '\"'; }
	get titleWidth():		   number { return u.getWidthOf(this.title) + 6; }
	get isRoot():			  boolean { return this == g.root; }
	get isBulkAlias():		  boolean { return this.trait == IDTrait.bulk; }
	get hasMultipleParents(): boolean { return this.parentPaths.length > 1; }
	get isAcrossBulk():		  boolean { return this.baseID != g.hierarchy.db.baseID; }
	get hasParents():		  boolean { return this.hasThings_fromFor(Predicate.idContains); }
	get isHere():			  boolean { return (get(s_path_here).thing?.id ?? k.empty) == this.id; }
	get hierarchy():		Hierarchy { return g.hierarchy; }

	get thing_isBulk_expanded(): boolean {		// cross db paths needs special attention
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
	hasThings_fromFor(idPredicate: string): boolean { return this.things_fromFor(idPredicate).length > 0; }

	override isInDifferentBulkThan(other: Thing): boolean {
		return super.isInDifferentBulkThan(other) || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
	}

	relationships_onceFrom(idPredicate: string): Array<Relationship> {
		return this.hierarchy.relationships_get_forPredicate_to_thing(idPredicate, true, this.id);
	}

	updateColorAttributes(path: Path) {
		const border = (path.isEditing ? 'dashed' : 'solid') + ' 1px ';
		const hover = border + path.dotColor(true);
		const grab = border + path.dotColor(false);
		this.borderAttribute = border;
		this.hoverAttributes = hover;
		this.grabAttributes = grab;
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

	things_fromFor(idPredicate: string): Array<Thing> {
		let fromThings: Array<Thing> = [];
		if (!this.isRoot) {
			const relationships = this.relationships_onceFrom(idPredicate);
			for (const relationship of relationships) {
				const thing = relationship.fromThing;
				if (thing) {
					fromThings.push(thing);
				}
			}
		}
		return fromThings;
	}

	paths_fromFor(idPredicate: string): Array<Path> {
		let pathsByHID: {[hash: number]: Path} = {};
		if (!this.isRoot) {
			const relationships = this.relationships_onceFrom(idPredicate);
			for (const relationship of relationships) {
				function addPath(path: Path) {
					const fullPath = path.appendID(endID);
					pathsByHID[fullPath.hashedPath] = fullPath;	
				}
				const endID = relationship.id;		// EGADS, this is the wrong relationship; needs the next one
				const fromThing = relationship.fromThing;
				const pathsFrom = fromThing?.paths_fromFor(idPredicate) ?? [];
				if (pathsFrom.length == 0) {
					addPath(g.rootPath);
				} else {
					for (const pathFrom of pathsFrom) {
						addPath(pathFrom);
					}
				}
			}
		}
		const paths = Object.values(pathsByHID);
		return u.sort_byTitleTop(paths).reverse();
	}
	
	paths_uniquelyFromFor(idPredicate: string): Array<Path> {
		if (this.isRoot) {
			return [];
		}
		const paths: Array<Path> = []
		const fromThings = this.things_fromFor(idPredicate) ?? [];
		for (const fromThing of fromThings) {
			if (fromThing.isRoot) {
				paths.push(g.singularRootPath);
			} else {
				const relationships = g.hierarchy.relationships_get_forPredicate_to_thing(idPredicate, true, fromThing.id);
				if (relationships.length > 0){
					paths.push(new Path(relationships[0].id, idPredicate, true))
				}
			}
		}
		return paths.length > 0 ? paths : idPredicate != Predicate.idContains ? [] : [g.rootPath];
	}

}
