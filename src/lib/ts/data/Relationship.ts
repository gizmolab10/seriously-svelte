import { k, get, Size, debug, Thing, DebugFlag, Orderable, dbDispatch, Predicate, PersistID, persistLocal, sort_byOrder, AlteringParent, graphEditor } from '../common/GlobalImports';
import { signal_rebuild, signal_relayout, signal_rebuild_fromHere, signal_relayout_fromHere, orders_normalize_remoteMaybe } from '../common/GlobalImports';
import { id_here, dot_size, row_height, id_editing, ids_grabbed, id_showTools, line_stretch, expanded, altering_parent } from '../managers/State'
import Airtable from 'airtable';

export default class Relationship extends Orderable {
	fromThing: Thing | null;
	toThing: Thing | null;
	doNotPersist = false;
	showCluster = false;
	idPredicate: string;
	isEditing = false;
	isGrabbed = false;
	db_type: string;
	idFrom: string;
	idTo: string;

	constructor(baseID: string, id: string | null, idPredicate: string, idFrom: string, idTo: string, order = 0, isRemotelyStored: boolean) {
		super(baseID, order, id, isRemotelyStored);
		this.idTo = idTo;							// idTo is child
		this.idFrom = idFrom;						// idFrom is parent. for root it is null
		this.idPredicate = idPredicate;
		this.db_type = dbDispatch.db.db_type;
		this.toThing = dbDispatch.db.hierarchy.thing_getForID(idTo);
		this.fromThing = dbDispatch.db.hierarchy.thing_getForID(idFrom);

		ids_grabbed.subscribe((idsGrab: string[]) => {
			const isGrabbed = idsGrab.includes(this.id);
			if (this.isGrabbed != isGrabbed) {
				this.isGrabbed  = isGrabbed;
			}
		});

		id_editing.subscribe((idEdit: string | null) => {
			const isEditing = (idEdit == this.id);
			if (this.isEditing != isEditing) {
				this.isEditing  = isEditing;
				this.toThing?.updateColorAttributes(this);
			}
		});

		id_showTools.subscribe((idCluster: string | null) => {
			const shouldShow = (idCluster != null) && idCluster == this.id && get(id_here) != this.id;
			if (this.showCluster != shouldShow) {
				this.showCluster = shouldShow;
				signal_rebuild_fromHere();
			}
		});
	}

	get fields(): Airtable.FieldSet { return { predicate: [this.idPredicate], from: [this.idFrom], to: [this.idTo], order: this.order }; }

	get hasChildren(): boolean { return this.childRelationships.length > 0; }
	get hasMultipleParents(): boolean { return this.parentRelationships.length > 1; }
	get visibleProgeny_halfHeight(): number { return this.visibleProgeny_height() / 2; }
	get visibleProgeny_halfSize(): Size { return this.visibleProgeny_size.dividedInHalf; }
	get isExpanded(): boolean { return this.doNotPersist || get(expanded)?.includes(this.id); }
	get singleRowHeight(): number { return this.showCluster ? k.clusterHeight : get(row_height); }
	get parentRelationships(): Array<Relationship> { return this.toThing?.parentRelationships ?? []; }
	get visibleProgeny_size(): Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height()); }
	get childRelationships(): Array<Relationship> { return sort_byOrder(this.toThing?.childRelationships ?? []) as Array<Relationship>; }
	get siblingRelationships(): Array<Relationship> { return sort_byOrder(this.fromThing?.childRelationships ?? []) as Array<Relationship>; }
	get description(): string { return ' \"' + this.baseID + '\" ' + this.isRemotelyStored + ' ' + this.order + ' ' + this.id + ' '	+ dbDispatch.db.hierarchy.thing_getForID(this.idFrom)?.description + ' => ' + dbDispatch.db.hierarchy.thing_getForID(this.idTo)?.description; }

	get isValid(): boolean {
		if (this.idPredicate && this.idFrom && this.idTo) {
			return true;
		}
		return false;
	}

	signal_rebuild()  { signal_rebuild(this.id); }
	signal_relayout() { signal_relayout(this.id); }
	expand()		  { this.expanded_setTo(true); }
	collapse()		  { this.expanded_setTo(false); }
	toggleExpand()	  { this.expanded_setTo(!this.isExpanded) }
	grabOnly()		  { this.hierarchy.grabs.grabOnly(this); }
	toggleGrab()	  { this.hierarchy.grabs.toggleGrab(this); }

	log(option: DebugFlag, message: string) {
		debug.log_maybe(option, message + ' ' + this.description);
	}

	revealColor(isReveal: boolean): string {
		let result = k.backgroundColor;
		const thing = this.toThing;
		if (thing) {
			const showBorder = this.isGrabbed || this.isEditing || thing.isExemplar;
			const useThingColor = isReveal != showBorder;
			result = useThingColor ? thing.color : k.backgroundColor;
		}
		return result;
	}

	startEdit() {
		if (this != this.hierarchy.root) {
			id_editing.set(this.id);
		}
	}

	async traverse(applyTo: (relationship: Relationship) => Promise<boolean>) {
		const thing = this.toThing;
		if (!await applyTo(this) && thing) {
			for (const progeny of thing.childRelationships) {
				await progeny.traverse(applyTo);
			}
		}
		return this;
	}

	ancestors(thresholdWidth: number): Array<Relationship> {
		let parent: Relationship | undefined = this;
		let totalWidth = 0;
		const array = [];
		while (parent) {
			totalWidth += parent.toThing?.titleWidth ?? 0;
			if (totalWidth > thresholdWidth) {
				break;
			}
			array.push(parent);
			parent = parent.fromThing?.parentRelationships[0];
		}
		array.reverse();
		return array;
	}

	async parent_alterMaybe() {
		const alteration = get(altering_parent);
		const relationship_showingTools = this.canAlterParentOf_showTools;
		if (relationship_showingTools) {
			altering_parent.set(null);
			id_showTools.set(null);
			switch (alteration) {
				case AlteringParent.deleting: await this.relationship_forget_remoteRemove(); break;
				case AlteringParent.adding: await this.toThing?.thing_remember_remoteAddAsChild(relationship_showingTools.toThing); break;
			}
			signal_rebuild_fromHere();
		}
	}

	get canAlterParentOf_showTools(): Relationship | null {
		const relationship_showTools = dbDispatch.db.hierarchy.relationship_getForID(get(id_showTools));
		if (relationship_showTools && relationship_showTools != this)  {
			const alteration = get(altering_parent);
			if ((alteration == AlteringParent.adding && !this.ancestors_include(relationship_showTools)) ||
				(alteration == AlteringParent.deleting && relationship_showTools.toThing?.parentRelationships.map(r => r.fromThing).includes(this.toThing))) {
				return relationship_showTools;
			}
		}
		return null;
	}

	ancestors_include(relationship: Relationship, visited: Array<string> = []): boolean {
		if (visited.length == 0 || !visited.includes(this.id)) {
			if (this.parentRelationships.length > 0) {
				for (let parentRelationship of this.parentRelationships) {
					if (parentRelationship.id == relationship.id || parentRelationship.ancestors_include(relationship, [...visited, this.id])) {
						return true;
					}
				};
			}
		}
		return false;
	}
	
	expanded_setTo(expand: boolean) {
		let mutated = false;
		expanded.update((array) => {
			if (array) {
				const index = array.indexOf(this.id);
				if (expand) {
					if (index == -1) {
						array.push(this.id);		// only add if not already added
						mutated = true;
					}
				} else if (index != -1) {			// only splice array when item is found
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

	clicked_dragDot(shiftKey: boolean) {
		if (this.toThing && !this.toThing.isExemplar) {
			if (get(altering_parent)) {
				this.parent_alterMaybe();
			} else if (shiftKey || this.isGrabbed) {
				this.toggleGrab();
			} else {
				this.grabOnly();
			}
		}
	}

	override async order_setTo(newOrder: number, remoteWrite: boolean) {
		if (Math.abs(this.order - newOrder) > 0.001) {
			const thing = dbDispatch.db.hierarchy.thing_getForID(this.idTo);
			await thing?.order_setTo(newOrder, remoteWrite);
		}
	}

	order_normalizeRecursive_remoteMaybe(remoteWrite: boolean) {
		const childRelationships = sort_byOrder(this.childRelationships ?? []) as Array<Relationship>;
		if (childRelationships && childRelationships.length > 1) {
			orders_normalize_remoteMaybe(childRelationships, remoteWrite);
			for (const childRelationship of childRelationships) {
				childRelationship.order_normalizeRecursive_remoteMaybe(remoteWrite);
			}
		}
	}

	becomeHere() {
		const thing = this.toThing;
		if (thing && thing.hasChildren) {
			id_here.set(this.id);
			this.expand();
			id_showTools.set(null);
			persistLocal.writeToDBKey(PersistID.here, this.id)
		};
	}

	async remoteWrite() {
		if (!this.awaitingCreation && !this.doNotPersist) {
			if (this.isRemotelyStored) {
				await dbDispatch.db.relationship_remoteUpdate(this);
			} else {
				await dbDispatch.db.relationship_remember_remoteCreate(this);
			}
		}
	}

	visibleProgeny_height(only: boolean = false, visited: Array<string> = []): number {
		const singleRowHeight = only ? get(row_height) : this.singleRowHeight;
		if (!visited.includes(this.id) && this.hasChildren && this.isExpanded) {
			let height = 0;
			for (const child of this.childRelationships) {
				height += child.visibleProgeny_height(only, [...visited, this.id]);
			}
			return Math.max(height, singleRowHeight);
		}
		return singleRowHeight;
	}

	visibleProgeny_width(isFirst: boolean = true, visited: Array<string> = []): number {
		let width = isFirst ? 0 : this.toThing?.titleWidth ?? 0;
		const thing = this.toThing;
		if (thing && !visited.includes(this.id) && this.isExpanded && thing.hasChildren) {
			let progenyWidth = 0;
			for (const child of this.childRelationships) {
				let childProgenyWidth = child.visibleProgeny_width(false, [...visited, this.id]);
				if (progenyWidth < childProgenyWidth) {
					progenyWidth = childProgenyWidth;
				}
			}
			width += progenyWidth + get(line_stretch) + get(dot_size) * (isFirst ? 2 : 1);
		}
		return width;
	}

	async thing_edit_remoteAddChildTo() {
		const parent = this.fromThing;
		if (parent) {
			const child = await this.hierarchy.thing_remember_runtimeCopy(this.baseID, parent);
			this.expand();
			await graphEditor.thing_edit_remoteAddAsChild(child, parent);
		}
	}

	async relationship_forget_remoteRemove() {
		const db = dbDispatch.db;
		db.hierarchy.relationship_forget(this);
		this.fromThing?.order_normalizeRecursive_remoteMaybe(true);
		await db.relationship_remoteDelete(this);
	}

	redraw_remoteMoveUp(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const siblingRelationships = this.siblingRelationships;
		if (!siblingRelationships || siblingRelationships.length == 0) {
			this.redraw_runtimeBrowseRight(true, EXTREME, up);
		} else {
			const index = this.order;
			const newIndex = index.increment(!up, siblingRelationships.length);
			if (!OPTION) {
				const newGrab = siblingRelationships[newIndex];
				if (SHIFT) {
					newGrab?.toggleGrab()
				} else {
					newGrab?.grabOnly();
				}
			} else if (k.allowGraphEditing) {
				const wrapped = up ? (index == 0) : (index == siblingRelationships.length - 1);
				const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
				const newOrder = newIndex + goose;
				const order = this.order;
				this.order_setTo(newOrder, true);
				this.order_normalizeRecursive_remoteMaybe(true);
				signal_relayout_fromHere();
				this.log(DebugFlag.order, `${order} => ${this.order} wanted: ${newOrder}`);
			}
		}
	}

	redraw_runtimeBrowseRight(RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		// const newHere = RIGHT ? this : this.grandparent;
		let newGrab: Relationship | undefined = RIGHT ? this.childRelationships[0] : this.fromThing?.parentRelationships[0];
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
						newGrab = undefined;
					} else if (newGrab.toThing == root) {
						newGrab = undefined;
					} else {
						newGrab.collapse();
					}
				}
			}
		} else if (this.hasChildren) {
			if (SHIFT) {
				newGrab = undefined;
			}
			this.expand();
		} else {
			return;
		}
		id_editing.set(null);
		newGrab?.grabOnly();
		// const allowToBecomeHere = (!SHIFT || newGrab == this.parentRelationships[0]) && newGrabIsNotHere; 
		// const shouldBecomeHere = !newHere.isVisible || newHere.doNotPersist;
		// if (!RIGHT && allowToBecomeHere && shouldBecomeHere) {
		// 	newHere.becomeHere();
		// }
	}

}