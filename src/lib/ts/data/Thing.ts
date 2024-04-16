import { g, k, u, get, Path, Datum, debug, IDTrait, Predicate } from '../common/GlobalImports';
import { DebugFlag, dbDispatch, Relationship, SeriouslyRange } from '../common/GlobalImports';
import { s_path_focus, s_paths_expanded } from '../state/State';
import Airtable from 'airtable';

export default class Thing extends Datum {
	selectionRange = new SeriouslyRange(0, 0);
	bulkRootID: string = k.empty;
	hoverAttributes = k.empty;
	borderAttribute = k.empty;
	grabAttributes = k.empty;
	needsBulkFetch = false;
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
	get parentPaths():	  Array<Path> { return this.parentPaths_for(Predicate.idContains); }
	get parents():		 Array<Thing> { return this.parentThings_for(Predicate.idContains); }
	get fields():	Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get idBridging():		   string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get description():		   string { return this.id + ' \"' + this.title + '\"'; }
	get titleWidth():		   number { return u.getWidthOf(this.title) + 6; }
	get isRoot():			  boolean { return this.trait == IDTrait.root; }
	get isBulkAlias():		  boolean { return this.trait == IDTrait.bulk; }
	get hasMultipleParents(): boolean { return this.parentPaths.length > 1; }
	get isAcrossBulk():		  boolean { return this.baseID != g.hierarchy.db.baseID; }
	get hasParents():		  boolean { return this.hasParentsFor(Predicate.idContains); }
	get isFocus():			  boolean { return (get(s_path_focus).thing?.id ?? k.empty) == this.id; }

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
		return this.parentThings_for(idPredicate).length > 0;
	}

	override isInDifferentBulkThan(other: Thing): boolean {
		return super.isInDifferentBulkThan(other) || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
	}

	relationships_grandParentsFor(idPredicate: string): Array<Relationship> {
		const relationships = this.parentRelationships_for(idPredicate);
		let grandParents: Array<Relationship> = [];
		for (const relationship of relationships) {
			const more = relationship.parentThing?.parentRelationships_for(idPredicate);
			if (more) {
				grandParents = u.concatenateArrays(grandParents, more);
			}
		}
		return grandParents;
	}

	parentRelationships_for(idPredicate: string): Array<Relationship> {
		return g.hierarchy.relationships_forPredicateThingIsChild(idPredicate, this.id, true);
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

	parentThings_for(idPredicate: string): Array<Thing> {
		let parents: Array<Thing> = [];
		if (!this.isRoot) {
			const relationships = this.parentRelationships_for(idPredicate);
			for (const relationship of relationships) {
				const thing = relationship.parentThing;
				if (thing) {
					parents.push(thing);
				}
			}
		}
		return parents;
	}

	parentPaths_for(idPredicate: string): Array<Path> {
		// all the paths that point to each parent of this thing
		let paths: Array<Path> = [];
		if (!this.isRoot) {
			const relationships = this.parentRelationships_for(idPredicate);
			for (const relationship of relationships) {
				const endID = relationship.id;		// EGADS, this is the wrong relationship; needs the next one
				const parent = relationship.parentThing;
				const parentPaths = parent?.parentPaths_for(Predicate.idContains) ?? [];
				if (parentPaths.length == 0) {
					addPath(g.rootPath);
				} else {
					for (const parentPath of parentPaths) {
						addPath(parentPath);
					}
				}
				function addPath(path: Path) {
					const fullPath = path.uniquelyAppendID(endID);
					if (fullPath) {
						paths.push(fullPath);
					}
				}
			}
		}
		paths = u.strip_hidDuplicates(paths);
		return u.sort_byTitleTop(paths).reverse();
	}
	
}
