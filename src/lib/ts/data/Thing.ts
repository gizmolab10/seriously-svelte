import { k, get, noop, Path, Datum, debug, Widget, Predicate, Hierarchy, TraitType, DebugFlag, getWidthOf, dbDispatch } from '../common/GlobalImports';
import { SeriouslyRange, CreationOptions, AlteringParent, signals, orders_normalize_remoteMaybe } from '../common/GlobalImports';
import { path_here, altering_parent, row_height, path_editing, paths_grabbed, path_toolsGrab } from '../managers/State';
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
	db_type: string;
	title: string;
	color: string;
	trait: string;
	order: number;

	constructor(baseID: string, id: string | null, title = k.defaultTitle, color = 'blue', trait = 's', order = 0, isRemotelyStored: boolean) {
		super(baseID, id, isRemotelyStored);
		this.db_type = dbDispatch.db.db_type;
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
	get isHere():					  boolean { return get(path_here)?.endsWith(this) ?? false; }
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

	get canAlterParentOf_toolsGrab(): Thing | null {
		const path_showingTools = get(path_toolsGrab);
		if (path_showingTools) {
			const thing_showingTools = dbDispatch.db.hierarchy.thing_getForPath(path_showingTools);
			if (thing_showingTools && thing_showingTools != this)  {
				const alteration = get(altering_parent);
				if ((alteration == AlteringParent.adding && !this.ancestors_include(thing_showingTools)) ||
					(alteration == AlteringParent.deleting && thing_showingTools.parentIDs.includes(this.id))) {
					return thing_showingTools;
				}
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

	signal_rebuild()  { signals.signal_rebuild(this.id); }
	signal_relayout() { signals.signal_relayout(this.id); }

	log(option: DebugFlag, message: string) {
		debug.log_maybe(option, message + ' ' + this.description);
	}

	debugLog(message: string) {
		this.log(DebugFlag.things, message);
	}

	revealColor(isReveal: boolean, path: Path): string {
		if (!path) {
			noop();
		}
		const showBorder = path.isGrabbed || path.isEditing || this.isExemplar;
		const useThingColor = isReveal != showBorder;
		return useThingColor ? this.color : k.backgroundColor;
	}

	startEdit() {
		if (this != this.hierarchy.root) {
			path_editing.set(this.id);
		}
	}

	updateColorAttributes(path: Path) {
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

	order_normalizeRecursive_remoteMaybe(remoteWrite: boolean) {
		const children = this.children;
		if (children && children.length > 1) {
			orders_normalize_remoteMaybe(children, remoteWrite);
			for (const child of children) {
				child.order_normalizeRecursive_remoteMaybe(remoteWrite);
			}
		}
	}

	async order_setTo(newOrder: number, remoteWrite: boolean) {
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

	async traverse(applyTo: (thing: Thing) => Promise<boolean>) {
		if (!await applyTo(this)) {
			for (const progeny of this.children) {
				await progeny.traverse(applyTo);
			}
		}
		return this;
	}

	async parent_alterMaybe() {
		const alteration = get(altering_parent);
		const other = this.canAlterParentOf_toolsGrab;
		if (other) {
			altering_parent.set(null);
			path_toolsGrab.set(null);
			switch (alteration) {
				case AlteringParent.deleting: await other.parent_forget_remoteRemove(this); break;
				case AlteringParent.adding: await this.thing_remember_remoteAddAsChild(other); break;
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

	async redraw_bulkFetchAll_runtimeBrowseRight(grab: boolean = true) {
		this.expand();		// do this before fetch, so next launch will see it
		await this.normalize_bulkFetchAll(this.title);
		if (this.hasChildren) {
			if (grab) {
				this.children[0].grabOnly()
			}
			this.expand();
			signals.signal_rebuild_fromHere();
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

	async thing_edit_remoteAddAsChild(child: Thing, startEdit: boolean = true) {
		await this.thing_remember_remoteAddAsChild(child);
		this.expand();
		signals.signal_rebuild_fromHere();
		child.grabOnly();
		if (startEdit) {
			setTimeout(() => {
				child.startEdit();
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
