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
	get parentPaths():	  Array<Path> { return this.paths_parentsFor(Predicate.idContains); }
	get parents():		 Array<Thing> { return this.things_get_parentsFor(Predicate.idContains); }
	get fields():	Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get idBridging():		   string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get description():		   string { return this.id + ' \"' + this.title + '\"'; }
	get titleWidth():		   number { return u.getWidthOf(this.title) + 6; }
	get isRoot():			  boolean { return this == g.root; }
	get isBulkAlias():		  boolean { return this.trait == IDTrait.bulk; }
	get hasMultipleParents(): boolean { return this.parentPaths.length > 1; }
	get isAcrossBulk():		  boolean { return this.baseID != g.hierarchy.db.baseID; }
	get hasParents():		  boolean { return this.hasParentsFor(Predicate.idContains); }
	get isHere():			  boolean { return (get(s_path_here).thing?.id ?? k.empty) == this.id; }

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

	hasParentsFor(idPredicate: string): boolean {
		return this.things_get_parentsFor(idPredicate).length > 0;
	}

	override isInDifferentBulkThan(other: Thing): boolean {
		return super.isInDifferentBulkThan(other) || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
	}

	relationships_grandParentsFor(idPredicate: string): Array<Relationship> {
		const relationships = this.relationships_immediateParentsFor(idPredicate);
		let grandParents: Array<Relationship> = [];
		for (const relationship of relationships) {
			const more = relationship.parentThing?.relationships_immediateParentsFor(idPredicate);
			if (more) {
				grandParents = [...grandParents, ...more];
			}
		}
		return grandParents;
	}

	relationships_immediateParentsFor(idPredicate: string): Array<Relationship> {
		return g.hierarchy.relationships_get_forPredicate_thing_isChild(idPredicate, this.id, true);
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

	things_get_parentsFor(idPredicate: string): Array<Thing> {
		let parents: Array<Thing> = [];
		if (!this.isRoot) {
			const parentRelationships = this.relationships_immediateParentsFor(idPredicate);
			for (const parentRelationship of parentRelationships) {
				const thing = parentRelationship.parentThing;
				if (thing) {
					parents.push(thing);
				}
			}
		}
		return parents;
	}

	paths_parentsFor(idPredicate: string): Array<Path> {
		let pathsByHID: {[hash: number]: Path} = {};
		if (!this.isRoot) {
			const parentRelationships = this.relationships_immediateParentsFor(idPredicate);
			for (const parentRelationship of parentRelationships) {
				const endID = parentRelationship.id;		// EGADS, this is the wrong parentRelationship; needs the next one
				const grandParent = parentRelationship.parentThing;
				const greatGrandParentPaths = grandParent?.paths_parentsFor(idPredicate) ?? [];
				if (greatGrandParentPaths.length == 0) {
					addPath(g.rootPath);
				} else {
					for (const greatGrandParentPath of greatGrandParentPaths) {
						addPath(greatGrandParentPath);
					}
				}
				function addPath(path: Path) {
					const fullPath = path.appendID(endID);
					if (fullPath) {
						pathsByHID[fullPath.hashedPath] = fullPath;	
					}
				}
			}
		}
		const paths = Object.values(pathsByHID);
		return u.sort_byTitleTop(paths).reverse();
	}
	
	paths_uniquelyChildrenFor(idPredicate: string): Array<Path> {
		return [];
	}
	
	parentPathsFor(idPredicate: string): Array<Path> {
		if (this.isRoot) {
			return [];
		}
		const paths: Array<Path> = []
		const parents = this.things_get_parentsFor(idPredicate) ?? [];
		for (const parent of parents) {
			if (parent.isRoot) {
				paths.push(g.rootPath);
			} else {
				const relationships = g.hierarchy.relationships_get_forPredicate_thing_isChild(idPredicate, parent.id, true);
				if (relationships.length > 0){
					const pathString = relationships[0].id;
					const path = g.hierarchy.path_remember_createUnique(pathString, idPredicate);
					if (path) {
						paths.push(path)
					}
				}
			}
		}
		return paths.length > 0 ? paths : idPredicate != Predicate.idContains ? [] : [g.rootPath];
	}
	
	paths_uniquelyFor(predicateID: string): Array<Path> {
		let paths: Array<Path> = [];
		switch (predicateID) {
			case Predicate.idIsRelated:	break;		// TODO: create unique path for relationship
			case Predicate.idContains:	return this.parentPathsFor(predicateID) ?? [];
		}
		return paths;
	}

}
