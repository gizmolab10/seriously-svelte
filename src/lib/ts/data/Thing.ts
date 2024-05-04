import { DebugFlag, dbDispatch, Relationship, SeriouslyRange } from '../common/GlobalImports';
import { k, u, get, Path, Datum, debug, IDTrait, Predicate } from '../common/GlobalImports';
import { s_path_focus, s_paths_expanded } from '../state/State';
import { h } from '../db/DBDispatch';
import Airtable from 'airtable';

export default class Thing extends Datum {
	selectionRange = new SeriouslyRange(0, 0);
	bulkRootID: string = k.empty;
	hoverAttributes = k.empty;
	borderAttribute = k.empty;
	grabAttributes = k.empty;
	needsBulkFetch = false;
	containsPath!: Path;
	isExemplar = false;
	isEditing = false;
	isGrabbed = false;
	title: string;
	color: string;
	trait: string;

	constructor(baseID: string, id: string | null, title = k.title_default, color = k.color_default, trait = 's', isRemotelyStored: boolean) {
		super(dbDispatch.db.dbType, baseID, id, isRemotelyStored);
		this.selectionRange = new SeriouslyRange(0, title.length);
		this.title = title;
		this.color = color;
		this.trait = trait;
	};
	
	get parentIDs():	Array<string> { return this.parents.map(t => t.id); }
	get parentPaths():	  Array<Path> { return this.parentPaths_for(Predicate.idContains); }
	get parents():		 Array<Thing> { return this.parents_forID(Predicate.idContains); }
	get fields():	Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get idBridging():		   string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get description():		   string { return this.id + ' \"' + this.title + '\"'; }
	get titleWidth():		   number { return u.getWidthOf(this.title) + 6; }
	get isRoot():			  boolean { return this.trait == IDTrait.root; }
	get isBulkAlias():		  boolean { return this.trait == IDTrait.bulk; }
	get hasMultipleParents(): boolean { return this.parentPaths.length > 1; }
	get isAcrossBulk():		  boolean { return this.baseID != h.db.baseID; }
	get hasParents():		  boolean { return this.hasParentsFor(Predicate.idContains); }
	get isFocus():			  boolean { return (get(s_path_focus).thing?.id ?? k.empty) == this.id; }
	get hasRelated():		  boolean { return this.relationships_bidirectional_for(Predicate.idIsRelated).length > 0; }

	get parents_ofAllKinds(): Array<Thing> {
		let parents: Array<Thing> = [];
		for (const predicate of h.predicates) {
			const more = this.parents_forID(predicate.id)
			parents = u.uniquely_concatenateArrays(parents, more);
		}
		return parents;
	}

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
		return this.parents_forID(idPredicate).length > 0;
	}

	override isInDifferentBulkThan(other: Thing): boolean {
		return super.isInDifferentBulkThan(other) || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
	}

	relationships_grandParentsFor(idPredicate: string): Array<Relationship> {
		const relationships = this.relationships_for_isChildOf(idPredicate, true);
		let grandParents: Array<Relationship> = [];
		for (const relationship of relationships) {
			const more = relationship.parent?.relationships_for_isChildOf(idPredicate, true);
			if (more) {
				grandParents = u.uniquely_concatenateArrays(grandParents, more);
			}
		}
		return grandParents;
	}

	things_bidirectional_for(idPredicate: string): Array<Thing> {
		const parents = this.relationships_for_isChildOf(idPredicate, true).map(r => r.parent);
		const children = this.relationships_for_isChildOf(idPredicate, false).map(r => r.child);
		return u.uniquely_concatenateArrays(parents, children);
	}

	relationships_bidirectional_for(idPredicate: string): Array<Relationship> {
		const children = this.relationships_for_isChildOf(idPredicate, true);
		const parents = this.relationships_for_isChildOf(idPredicate, false);
		return u.uniquely_concatenateArrays(parents, children);
	}

	relationships_for_isChildOf(idPredicate: string, isChildOf: boolean): Array<Relationship> {
		return h.relationships_forPredicateThingIsChild(idPredicate, this.id, isChildOf);
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

	parents_forID(idPredicate: string): Array<Thing> {
		let parents: Array<Thing> = [];
		if (!this.isRoot) {
			const relationships = this.relationships_for_isChildOf(idPredicate, true);
			for (const relationship of relationships) {
				const thing = relationship.parent;
				if (!!thing) {
					parents.push(thing);
				}
			}
		}
		return parents;
	}

	parentPaths_for(idPredicate: string, visited: Array<string> = []): Array<Path> {
		// all the paths that point to each parent of this thing
		let paths: Array<Path> = [];
		if (!this.isRoot) {
			const isRelated = idPredicate == Predicate.idIsRelated;
			const relationships = this.relationships_for_isChildOf(idPredicate, true);
			for (const relationship of relationships) {
				if (isRelated) {
					addPath(relationship.child?.containsPath ?? null);
				} else {
					const parent = relationship.parent;
					if (parent && !visited.includes(parent.id)) {
						const endID = relationship.id;		// EGADS, this is the wrong relationship; needs the next one
						const parentPaths = parent.parentPaths_for(idPredicate, u.uniquely_concatenateArrays(visited, [parent.id])) ?? [];
						if (parentPaths.length == 0) {
							addPath(h.rootPath.uniquelyAppendID(endID));
						} else {
							for (const parentPath of parentPaths) {
								addPath(parentPath.uniquelyAppendID(endID));
							}
						}
					}
				}
			}
			function addPath(path: Path | null) {
				if (!!path) {
					paths.push(path);
				}
			}
		}
		paths = u.strip_hidDuplicates(paths);
		return u.sort_byTitleTop(paths).reverse();
	}
	
}
