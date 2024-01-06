import { k, get, Size, Datum, debug, Predicate, Hierarchy, TraitType, PersistID, DebugFlag, dbDispatch, getWidthOf, persistLocal, CreationOptions, AlteringParent } from '../common/GlobalImports';
import { SeriouslyRange, signal_rebuild, signal_relayout, signal_rebuild_fromHere, signal_relayout_fromHere, orders_normalize_remoteMaybe } from '../common/GlobalImports';
import { id_here, dot_size, expanded, altering_parent, row_height, id_editing, ids_grabbed, line_stretch, id_toolsGrab } from '../managers/State';
import Airtable from 'airtable';

export default class Thing extends Datum {
	selectionRange: SeriouslyRange | null = null;
    bulkRootID: string = '';
	needsBulkFetch = false;
	hoverAttributes = '';
	borderAttribute = '';
	grabAttributes = '';
	showCluster = false;
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

		this.updateColorAttributes();

		id_editing.subscribe((idEdit: string | null) => {
			const isEditing = (idEdit == this.id);
			if (this.isEditing != isEditing) {
				this.isEditing  = isEditing;
				this.updateColorAttributes();
			}
		});

		ids_grabbed.subscribe((idsGrab: string[]) => {
			const isGrabbed = idsGrab.includes(this.id);
			if (this.isGrabbed != isGrabbed) {
				this.isGrabbed  = isGrabbed;
				this.updateColorAttributes();
			}
		});

		id_toolsGrab.subscribe((idCluster: string | null) => {
			const shouldShow = (idCluster != null) && idCluster == this.id && get(id_here) != this.id;
			if (this.showCluster != shouldShow) {
				this.showCluster = shouldShow;
				signal_rebuild_fromHere();
			}
		});
	};

	
	get fields():			Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get parentIDs():			Array<string> { return this.hierarchy.thingIDs_getByIDPredicateToAndID(Predicate.idIsAParentOf,  true, this.id); }
	get children():				 Array<Thing> { return this.hierarchy.things_getByIDPredicateToAndID(Predicate.idIsAParentOf, false, this.idForChildren); }
	get parents():				 Array<Thing> { return this.hierarchy.things_getByIDPredicateToAndID(Predicate.idIsAParentOf,  true, this.id); }
	get siblings():				 Array<Thing> { return this.firstParent?.children ?? []; }
	get hierarchy():				Hierarchy { return dbDispatch.db.hierarchy; }
	get hasChildren():				  boolean { return this.children.length > 0; }
	get hasParents():				  boolean { return this.parents.length > 0; }
	get isHere():					  boolean { return this.id == get(id_here); }
	get isRoot():					  boolean { return this == this.hierarchy.root; }
	get isBulkAlias():				  boolean { return this.trait == TraitType.bulk; }
	get isExpanded():				  boolean { return this.isRoot || get(expanded)?.includes(this.parentRelationshipID); }
	get isVisible():				  boolean { return this.ancestors(Number.MAX_SAFE_INTEGER).includes(this.hierarchy.here!); }
	get grandparent():					Thing { return this.firstParent?.firstParent ?? this.hierarchy.root; }
	get lastChild():					Thing { return this.children.slice(-1)[0]; }	// not alter children
	get firstChild():					Thing { return this.children[0]; }
	get firstParent():					Thing { return this.parents[0]; }
	get description():				   string { return this.id + ' \"' + this.title + '\"'; }
	get idForChildren():               string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get titleWidth():				   number { return getWidthOf(this.title) }
	get visibleProgeny_halfHeight():   number { return this.visibleProgeny_height() / 2; }
	get visibleProgeny_halfSize():		 Size { return this.visibleProgeny_size.dividedInHalf; }
	get visibleProgeny_size():			 Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height()); }

	get parentRelationshipID(): string { // WRONG
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

	get singleRowHeight(): number {
		return this.showCluster ? k.clusterHeight : get(row_height);
	}

	visibleProgeny_height(only: boolean = false, visited: Array<string> = []): number {
		const singleRowHeight = only ? get(row_height) : this.singleRowHeight;
		if (!visited.includes(this.id) && this.hasChildren && this.isExpanded) {
			let height = 0;
			for (const child of this.children) {
				height += child.visibleProgeny_height(only, [...visited, this.id]);
			}
			return Math.max(height, singleRowHeight);
		}
		return singleRowHeight;
	}

	visibleProgeny_width(isFirst: boolean = true, visited: Array<string> = []): number {
		let width = isFirst ? 0 : this.titleWidth;
		if (!visited.includes(this.id) && this.isExpanded && this.hasChildren) {
			let progenyWidth = 0;
			for (const child of this.children) {
				let childProgenyWidth = child.visibleProgeny_width(false, [...visited, this.id]);
				if (progenyWidth < childProgenyWidth) {
					progenyWidth = childProgenyWidth;
				}
			}
			width += progenyWidth + get(line_stretch) + get(dot_size) * (isFirst ? 2 : 1);
		}
		return width;
	}
	
	signal_rebuild()  { signal_rebuild(this.id); }
	signal_relayout() { signal_relayout(this.id); }
	toggleGrab()	  { this.hierarchy.grabs.toggleGrab(this); }
	grabOnly()		  { this.hierarchy.grabs.grabOnly(this); }
	toggleExpand()	  { this.expanded_setTo(!this.isExpanded) }
	collapse()		  { this.expanded_setTo(false); }
	expand()		  { this.expanded_setTo(true); }

	log(option: DebugFlag, message: string) {
		debug.log_maybe(option, message + ' ' + this.description);
	}

	debugLog(message: string) {
		this.log(DebugFlag.things, message);
	}

	revealColor(isReveal: boolean): string {
		const showBorder = this.isGrabbed || this.isEditing || this.isExemplar;
		const useThingColor = isReveal != showBorder;
		return useThingColor ? this.color : k.backgroundColor;
	}

	startEdit() {
		if (this != this.hierarchy.root) {
			id_editing.set(this.id);
		}
	}

	updateColorAttributes() {
		const borderStyle = this.isEditing ? 'dashed' : 'solid';
		const border = borderStyle + ' 1px ';
		const hover = border + this.revealColor(true);
		const grab = border + this.revealColor(false);
		this.borderAttribute = border;
		this.hoverAttributes = hover;
		this.grabAttributes = grab;
	}
	
	expanded_setTo(expand: boolean) {
		let mutated = false;
		const relationship = this.hierarchy.relationship_getWhereIDEqualsTo(this.id);
		if (relationship) {
			expanded.update((array) => {
				if (array) {
					const index = array.indexOf(relationship.id);
					if (expand) {
						if (index == -1) {
							array.push(relationship.id);	// only add if not already added
							mutated = true;
						}
					} else if (index != -1) {					// only splice array when item is found
						array.splice(index, 1);			// 2nd parameter means 'remove one item only'
						mutated = true;
					}
				}
				return array;
			});
			if (mutated) {			// avoid disruptive rebuild
				persistLocal.writeToDBKey(PersistID.expanded, get(expanded));
				signal_rebuild_fromHere();
			}
		}
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

	becomeHere() {
		if (this.hasChildren) {
			id_here.set(this.id);
			this.expand();
			id_toolsGrab.set(null);
			persistLocal.writeToDBKey(PersistID.here, this.id)
		};
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

	nextSibling(increment: boolean): Thing {
		const array = this.siblings;
		const index = array.indexOf(this);
		let siblingIndex = index.increment(increment, array.length)
		if (index == 0) {
			siblingIndex = 1;
		}
		return array[siblingIndex];
	}

	async traverse(applyTo: (thing: Thing) => Promise<boolean>) {
		if (!await applyTo(this)) {
			for (const progeny of this.children) {
				await progeny.traverse(applyTo);
			}
		}
		return this;
	}

	relationship_fromParent(parent: Thing) {
		return this.hierarchy.relationship_getForIDs_predicateFromAndTo(Predicate.idIsAParentOf, this.id, parent.id);
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

	clicked_dragDot(shiftKey: boolean) {
		if (!this.isExemplar) {
			if (get(altering_parent)) {
				this.parent_alterMaybe();
			} else if (shiftKey || this.isGrabbed) {
				this.toggleGrab();
			} else {
				this.grabOnly();
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

	redraw_remoteMoveUp(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const parent = this.firstParent;
		const siblings = parent.children;
		if (!siblings || siblings.length == 0) {
			this.redraw_runtimeBrowseRight(true, EXTREME, up);
		} else {
			const index = siblings.indexOf(this);
			const newIndex = index.increment(!up, siblings.length);
			if (!OPTION) {
				const newGrab = siblings[newIndex];
				if (SHIFT) {
					newGrab?.toggleGrab()
				} else {
					newGrab?.grabOnly();
				}
			} else if (k.allowGraphEditing) {
				const wrapped = up ? (index == 0) : (index == siblings.length - 1);
				const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
				const newOrder = newIndex + goose;
				const order = this.order;
				this.order_setTo(newOrder, true);
				parent.order_normalizeRecursive_remoteMaybe(true);
				signal_relayout_fromHere();
				this.log(DebugFlag.order, `${order} => ${this.order} wanted: ${newOrder}`);
				parent.log(DebugFlag.order, `MAP ${parent.children.map(c => c.order)}`);
			}
		}
	}

	redraw_runtimeBrowseRight(RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		const newHere = RIGHT ? this : this.grandparent;
		let newGrab: Thing | null = RIGHT ? this.firstChild : this.firstParent;
		const newGrabIsNotHere = get(id_here) != newGrab?.id;
		if (!RIGHT) {
			const root = this.hierarchy.root;
			if (EXTREME) {
				root?.becomeHere();	// tells graph to update line rects
			} else {
				if (!SHIFT) {
					if (fromReveal) {
						this.expand();
					} else if (newGrabIsNotHere && newGrab && !newGrab.isExpanded) {
						newGrab?.expand();
					}
				} else if (newGrab) { 
					if (this.isExpanded) {
						this.collapse();
						newGrab = null;
					} else if (newGrab == root) {
						newGrab = null;
					} else {
						newGrab.collapse();
					}
				}
			}
		} else if (this.hasChildren) {
			if (SHIFT) {
				newGrab = null;
			}
			this.expand();
		} else {
			return;
		}
		id_editing.set(null);
		newGrab?.grabOnly();
		const allowToBecomeHere = (!SHIFT || newGrab == this.firstParent) && newGrabIsNotHere; 
		const shouldBecomeHere = !newHere.isVisible || newHere.isRoot;
		if (!RIGHT && allowToBecomeHere && shouldBecomeHere) {
			newHere.becomeHere();
		}
	}

}
