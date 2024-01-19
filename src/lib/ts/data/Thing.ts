import { k, get, noop, Path, Datum, debug, signals, Predicate, Hierarchy, TraitType, DebugFlag } from '../common/GlobalImports';
import { getWidthOf, dbDispatch, SeriouslyRange, orders_normalize_remoteMaybe } from '../common/GlobalImports';
import { s_path_here } from '../managers/State';
import Airtable from 'airtable';

export default class Thing extends Datum {
	selectionRange: SeriouslyRange | null = null;
    bulkRootID: string = '';
	needsBulkFetch = false;
	hoverAttributes = '';
	borderAttribute = '';
	grabAttributes = '';
	isExemplar = false;
	isEditing = false;
	isGrabbed = false;
	s_db_type: string;
	title: string;
	color: string;
	trait: string;
	order: number;

	constructor(baseID: string, id: string | null, title = k.defaultTitle, color = 'blue', trait = 's', order = 0, isRemotelyStored: boolean) {
		super(baseID, id, isRemotelyStored);
		this.s_db_type = dbDispatch.db.s_db_type;
		this.title = title;
		this.color = color;
		this.trait = trait;
		this.order = order;
	};
	
	get fields():			Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get parentIDs():			Array<string> { return this.hierarchy.thingIDs_getByIDPredicateToAndID(Predicate.idIsAParentOf,  true, this.id); }
	get children():				 Array<Thing> { return this.hierarchy.things_getByIDPredicateToAndID(Predicate.idIsAParentOf, false, this.idForChildren); }
	get parents():				 Array<Thing> { return this.hierarchy.things_getByIDPredicateToAndID(Predicate.idIsAParentOf,  true, this.id); }
	get hierarchy():				Hierarchy { return dbDispatch.db.hierarchy; }
	get hasChildren():				  boolean { return this.children.length > 0; }
	get hasParents():				  boolean { return this.parents.length > 0; }
	get isHere():					  boolean { return get(s_path_here)?.endsWith(this) ?? false; }
	get isRoot():					  boolean { return this == this.hierarchy.root; }
	get isBulkAlias():				  boolean { return this.trait == TraitType.bulk; }
	get lastChild():					Thing { return this.children.slice(-1)[0]; }	// not alter children
	get firstChild():					Thing { return this.children[0]; }
	get description():				   string { return this.id + ' \"' + this.title + '\"'; }
	get idForChildren():               string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get titleWidth():				   number { return getWidthOf(this.title) }

	get parentRelationshipID(): string { // WRONG
		return this.hierarchy.relationship_getWhereIDEqualsTo(this.id)?.id ?? '';
	}

	get hasGrandChildren(): boolean {
		if (this.hasChildren) {
			for (const child of this.children) {
				if (child.hasChildren) {
					return true;
				}
			}
		}
		return false;
	}

	signal_rebuild()  { signals.signal_rebuild(this.id); }
	signal_relayout() { signals.signal_relayout(this.id); }

	log(option: DebugFlag, message: string) {
		debug.log_maybe(option, message + ' ' + this.description);
	}

	debugLog(message: string) {
		this.log(DebugFlag.things, message);
	}

	revealColor(isReveal: boolean, path: Path): string {
		const showBorder = path.isGrabbed || path.isEditing || this.isExemplar;
		const useThingColor = isReveal != showBorder;
		return useThingColor ? this.color : k.backgroundColor;
	}

	updateColorAttributes(path: Path) {
		if (path.isEditing) {
			noop();
		}
		const border = (path.isEditing ? 'dashed' : 'solid') + ' 1px ';
		const hover = border + this.revealColor(true, path);
		const grab = border + this.revealColor(false, path);
		this.borderAttribute = border;
		this.hoverAttributes = hover;
		this.grabAttributes = grab;
	}

	ancestors_include(thing: Thing, visited: Array<string> = []): boolean {
		if (visited.length == 0 || !visited.includes(this.id)) {
			if (this.parents.length > 0) {
				for (let parent of this.parents) {
					if (parent.id == thing.id || parent.ancestors_include(thing, [...visited, this.id])) {
						console.log(thing.title, '[is an ancestor of]', this.title);
						return true;
					}
				};
			}
		}
		return false;
	}

	order_normalizeRecursive_remoteMaybe(remoteWrite: boolean, visited: Array<string> = []) {
		const children = this.children;
		if (!visited.includes(this.id) && children && children.length > 1) {
			orders_normalize_remoteMaybe(children, remoteWrite);
			for (const child of children) {
				child.order_normalizeRecursive_remoteMaybe(remoteWrite, [...visited, this.id]);
			}
		}
	}

	async order_setTo(newOrder: number, remoteWrite: boolean = false) {
		const relationship = this.hierarchy.relationship_getWhereIDEqualsTo(this.id);
		if (relationship && Math.abs(relationship.order - newOrder) > 0.001) {
			const oldOrder = relationship.order;
			relationship.order = newOrder;
			this.order = newOrder;
			if (remoteWrite) {
				this.log(DebugFlag.order, `${oldOrder} => ${newOrder}`);
				await relationship.remoteWrite();
			}
		}
	}

	traverse(applyTo: (thing: Thing) => boolean) {
		if (!applyTo(this)) {
			for (const child of this.children) {
				child.traverse(applyTo);
			}
		}
	}

	async traverse_async(applyTo: (thing: Thing) => Promise<boolean>) {
		if (!await applyTo(this)) {
			for (const child of this.children) {
				await child.traverse_async(applyTo);
			}
		}
	}

	thing_isInDifferentBulkThan(other: Thing) {
		return this.baseID != other.baseID || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
	}

	async normalize_bulkFetchAll(baseID: string) {
		await dbDispatch.db.fetch_allFrom(baseID)
		await dbDispatch.db.hierarchy?.relationships_remoteCreateMissing(this);
		await dbDispatch.db.hierarchy?.relationships_removeHavingNullReferences();
		this.order_normalizeRecursive_remoteMaybe(true);
	}

}
