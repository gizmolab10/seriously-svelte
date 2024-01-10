import { sort_byOrder, AlteringParent, SeriouslyRange, signal_rebuild, signal_relayout, signal_rebuild_fromHere, signal_relayout_fromHere, orders_normalize_remoteMaybe } from '../common/GlobalImports';
import { k, get, Size, debug, Predicate, TraitType, PersistID, DebugFlag, Orderable, dbDispatch, getWidthOf, Relationship, persistLocal, CreationOptions } from '../common/GlobalImports';
import { id_here, dot_size, expanded, altering_parent, row_height, id_editing, ids_grabbed, line_stretch, id_toolsGrab } from '../managers/State';
import Airtable from 'airtable';

export default class Thing extends Orderable {
	selectionRange: SeriouslyRange | null = null;
    bulkRootID: string = '';
	needsBulkFetch = false;
	hoverAttributes = '';
	borderAttribute = '';
	grabAttributes = '';
	isExemplar = false;
	isEditing = false;
	isGrabbed = false;
	db_type: string;
	title: string;
	color: string;
	trait: string;

	constructor(baseID: string, id: string | null, title = k.defaultTitle, color = 'blue', trait = 's', order = 0, isRemotelyStored: boolean) {
		super(baseID, order, id, isRemotelyStored);
		this.db_type = dbDispatch.db.db_type;
		this.title = title;
		this.color = color;
		this.trait = trait;
	};

	
	get fields():				 Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get parentRelationships(): Array<Relationship> { return this.hierarchy.relationships_getByIDPredicateToAndID(Predicate.idIsAParentOf, true, this.idForChildren); }
	get childRelationships():  Array<Relationship> { return this.hierarchy.relationships_getByIDPredicateToAndID(Predicate.idIsAParentOf, false, this.idForChildren); }
	get parentIDs():				 Array<string> { return this.hierarchy.thingIDs_getByIDPredicateToAndID(Predicate.idIsAParentOf,  true, this.id); }
	get children():					  Array<Thing> { return this.hierarchy.things_getByIDPredicateToAndID(Predicate.idIsAParentOf, false, this.idForChildren); }
	get parents():					  Array<Thing> { return this.hierarchy.things_getByIDPredicateToAndID(Predicate.idIsAParentOf,  true, this.id); }
	get siblings():					  Array<Thing> { return this.firstParent?.children ?? []; }
	get hasChildren():					   boolean { return this.children.length > 0; }
	get hasParents():					   boolean { return this.parents.length > 0; }
	get isHere():						   boolean { return this.id == get(id_here); }
	get isRoot():						   boolean { return this == this.hierarchy.root?.toThing; }
	get isBulkAlias():					   boolean { return this.trait == TraitType.bulk; }
	get isVisible():					   boolean { return this.ancestors(Number.MAX_SAFE_INTEGER).includes(this.hierarchy.here!.toThing!); }
	get grandparent():						 Thing { return this.firstParent?.firstParent ?? this.hierarchy.root; }
	get lastChild():						 Thing { return this.children.slice(-1)[0]; }	// not alter children
	get firstChild():						 Thing { return this.children[0]; }
	get firstParent():						 Thing { return this.parents[0]; }
	get description():						string { return this.id + ' \"' + this.title + '\"'; }
	get idForChildren():					string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get titleWidth():						number { return getWidthOf(this.title) }

	get parentRelationshipID(): string { // WRONG (TODO ???)
		return this.hierarchy.relationship_getWhereIDEqualsTo(this.id)?.id ?? '';
	}

	get canAlterParentOf_toolsGrab(): Thing | null {
		const id_showsTools = get(id_toolsGrab);
		const showsTools = dbDispatch.db.hierarchy.thing_getForID(id_showsTools);
		if (id_showsTools && showsTools && showsTools != this)  {
			const alteration = get(altering_parent);
			if ((alteration == AlteringParent.adding && !this.ancestors_include(showsTools)) ||
				(alteration == AlteringParent.deleting && showsTools.parentIDs.includes(this.id))) {
				return showsTools;
			}
		}
		return null;
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

	log(option: DebugFlag, message: string) {
		debug.log_maybe(option, message + ' ' + this.description);
	}

	debugLog(message: string) {
		this.log(DebugFlag.things, message);
	}

	updateColorAttributes(relationship: Relationship) {
		const borderStyle = relationship.isEditing ? 'dashed' : 'solid';
		const border = borderStyle + ' 1px ';
		const hover = border + relationship.revealColor(true);
		const grab = border + relationship.revealColor(false);
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

	ancestors(thresholdWidth: number): Array<Thing> {
		let parent: Thing | null = this;
		let totalWidth = 0;
		const array = [];
		while (parent) {
			totalWidth += parent.titleWidth;
			if (totalWidth > thresholdWidth) {
				break;
			}
			array.push(parent);
			parent = parent.firstParent;
		}
		array.reverse();
		return array;
	}

	childrenIDs_anyMissingFromIDsOf(children: Array<Thing>) {
		if (this.children.length != children.length) {
			return true;
		}
		const cIDs = this.children.map(c => c.id);
		for (const child of children) {
			if (!cIDs.includes(child.id)) {
				return true;
			}
		}
		return false;
	}

	override async order_setTo(newOrder: number, remoteWrite: boolean) {
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

	nextSibling(increment: boolean): Thing {
		const array = this.siblings;
		const index = array.indexOf(this);
		let siblingIndex = index.increment(increment, array.length)
		if (index == 0) {
			siblingIndex = 1;
		}
		return array[siblingIndex];
	}

	relationship_fromParent(parent: Thing) {
		return this.hierarchy.relationship_getForIDs_predicateFromAndTo(Predicate.idIsAParentOf, parent.id, this.id);
	}

	async parent_alterMaybe() {
		const alteration = get(altering_parent);
		const other = this.canAlterParentOf_toolsGrab;
		if (other) {
			altering_parent.set(null);
			id_toolsGrab.set(null);
			switch (alteration) {
				case AlteringParent.deleting: await other.parent_forget_remoteRemove(this); break;
				case AlteringParent.adding: await this.thing_remember_remoteAddAsChild(other); break;
			}
			signal_rebuild_fromHere();
		}
	}

	thing_isInDifferentBulkThan(other: Thing) {
		return this.baseID != other.baseID || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
	}

	async normalize_bulkFetchAll(baseID: string) {
		await dbDispatch.db.fetch_allFrom(baseID)
		await dbDispatch.db.hierarchy?.relationships_remoteCreateMissing(this);
		await dbDispatch.db.hierarchy?.relationships_removeHavingNullReferences();
		dbDispatch.db.hierarchy?.root?.order_normalizeRecursive_remoteMaybe(true);
	}

	async redraw_bulkFetchAll_runtimeBrowseRight(grab: boolean = true) {
		this.expand();		// do this before fetch, so next launch will see it
		await this.normalize_bulkFetchAll(this.title);
		if (this.hasChildren) {
			if (grab) {
				this.childRelationships[0].grabOnly()
			}
			this.expand();
			signal_rebuild_fromHere();
		}
	}

	async parent_forget_remoteRemove(parent: Thing) {
		const h = dbDispatch.db.hierarchy;
		const relationship = h.relationships_getByIDPredicateFromAndTo(Predicate.idIsAParentOf, parent.id, this.id);
		if (relationship && this.parents.length > 1) {
			h.relationship_forget(relationship);
			parent.order_normalizeRecursive_remoteMaybe(true);
			await dbDispatch.db.relationship_remoteDelete(relationship);
		}
	}

	afterAdding(startEdit: boolean = true) {
		const relationship = this.parentRelationships[0];
		signal_rebuild_fromHere();
		relationship.grabOnly();
		if (startEdit) {
			setTimeout(() => {
				relationship.startEdit();
			}, 200);
		}

	}

	async thing_remember_remoteAddAsChild(child: Thing): Promise<any> {
		const changingBulk = this.isBulkAlias || child.baseID != dbDispatch.db.baseID;
		const baseID = changingBulk ? child.baseID : this.baseID;
		const idPredicateIsAParentOf = Predicate.idIsAParentOf;
		const parentID = this.idForChildren;
		if (!child.isRemotelyStored) {	
			await dbDispatch.db.thing_remember_remoteCreate(child);			// for everything below, need to await child.id fetched from dbDispatch
		}
		const relationship = await dbDispatch.db.hierarchy.relationship_remember_remoteCreateUnique(baseID, null, idPredicateIsAParentOf, parentID, child.id, child.order, CreationOptions.getRemoteID)
		await orders_normalize_remoteMaybe(this.children);		// write new order values for relationships
		return relationship;
	}

}
