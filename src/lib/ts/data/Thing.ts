import { k, get, Size, Datum, debug, signal, Signals, Predicate, Hierarchy, TraitType, PersistID, DebugFlag } from '../common/GlobalImports';
import { dbDispatch, persistLocal, getWidthOf, signal_rebuild, SeriouslyRange, orders_normalize_remoteMaybe } from '../common/GlobalImports';
import { id_here, dot_size, id_editing, expanded, ids_grabbed, row_height, id_showRevealCluster, line_stretch } from '../managers/State';
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

		id_showRevealCluster.subscribe((idCluster: string | null) => {
			const shouldShow = (idCluster != undefined) && idCluster == this.id && get(id_here) != this.id;
			if (this.showCluster != shouldShow) {
				this.showCluster = shouldShow;
				signal_rebuild();
			}
		});
	};

	get fields():		  Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get siblings():			   Array<Thing> { return this.firstParent?.children ?? []; }
	get children():			   Array<Thing> { const idP = Predicate.idIsAParentOf; return this.hierarchy.things_getByIDPredicateToAndID(idP, false, this.idForChildren); }
	get parents():			   Array<Thing> { const idP = Predicate.idIsAParentOf; return this.hierarchy.things_getByIDPredicateToAndID(idP,	true, this.id); }
	get hierarchy():			  Hierarchy { return dbDispatch.db.hierarchy; }
	get hasChildren():				boolean { return this.hasPredicate(false); }
	get hasParents():				boolean { return this.hasPredicate(true); }
	get isHere():					boolean { return this.id == get(id_here); }
	get isRoot():					boolean { return this == this.hierarchy.root; }
	get isBulkAlias():				boolean { return this.trait == TraitType.bulk; }
	get isExpanded():				boolean { return this.isRoot || get(expanded)?.includes(this.parentRelationshipID); }
	get isVisible():				boolean { return this.ancestors(Number.MAX_SAFE_INTEGER).includes(this.hierarchy.here!); }
	get grandparent():				  Thing { return this.firstParent?.firstParent ?? this.hierarchy.root; }
	get lastChild():				  Thing { return this.children.slice(-1)[0]; }	// not alter children
	get firstChild():				  Thing { return this.children[0]; }
	get firstParent():				  Thing { return this.parents[0]; }
	get description():				 string { return this.id + ' \"' + this.title + '\"'; }
	get idForChildren():             string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get titleWidth():				 number { return getWidthOf(this.title) }
	get visibleProgeny_halfHeight(): number { return this.visibleProgeny_height / 2; }
	get visibleProgeny_halfSize():	   Size { return this.visibleProgeny_size.dividedInHalf; }
	get visibleProgeny_size():		   Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height); }

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

	get singleRowHeight(): number {
		return this.showCluster ? k.clusterHeight : get(row_height);
	}

	get visibleProgeny_height(): number {
		const singleRowHeight = this.singleRowHeight;
		if (this.hasChildren && this.isExpanded) {
			let height = 0;
			for (const child of this.children) {
				height += child.visibleProgeny_height;
			}
			return Math.max(height, singleRowHeight);
		}
		return singleRowHeight;
	}

	get visibleProgenyOnly_height(): number {
		const singleRowHeight = get(row_height);
		if (this.hasChildren && this.isExpanded) {
			let height = 0;
			for (const child of this.children) {
				height += child.visibleProgeny_height;
			}
			return Math.max(height, singleRowHeight);
		}
		return singleRowHeight;
	}

	visibleProgeny_width(isFirst: boolean = true): number {
		let width = isFirst ? 0 : this.titleWidth;
		if (this.hasChildren && this.isExpanded) {
			let progenyWidth = 0;
			for (const child of this.children) {
				let childProgenyWidth = child.visibleProgeny_width(false);
				if (progenyWidth < childProgenyWidth) {
					progenyWidth = childProgenyWidth;
				}
			}
			width += progenyWidth + get(line_stretch) + get(dot_size) * (isFirst ? 2 : 1);
		}
		return width;
	}
	
	thing_relayout() { signal(Signals.relayout, this.id); }
	toggleGrab()	 { this.hierarchy.grabs.toggleGrab(this); }
	grabOnly()		 { this.hierarchy.grabs.grabOnly(this); }
	toggleExpand()	 { this.expanded_setTo(!this.isExpanded) }
	collapse()		 { this.expanded_setTo(false); }
	expand()		 { this.expanded_setTo(true); }

	hasPredicate(asParents: boolean): boolean {
		return asParents ? this.parents.length > 0 : this.children.length > 0
	}

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
		const relationship = this.hierarchy.relationship_getWhereIDEqualsTo(this.id);
		if (relationship) {
			expanded.update((array) => {
				if (array) {
					if (expand) {
						if (array.indexOf(relationship.id) == -1) {
							array.push(relationship.id);	// only add if not already added
						}
					} else {
						const index = array.indexOf(relationship.id);
						if (index != -1) {					// only splice array when item is found
							array.splice(index, 1);			// 2nd parameter means 'remove one item only'
						}
					}
				}
				return array;
			});
			persistLocal.writeToDBKey(PersistID.expanded, get(expanded));
			signal_rebuild();
		}
	}

	ancestors(thresholdWidth: number): Array<Thing> {
		let thing: Thing = this;
		let totalWidth = 0;
		const array = [];
		while (thing) {
			totalWidth += thing.titleWidth;
			if (totalWidth > thresholdWidth) {
				break;
			}
			array.push(thing);
			thing = thing.firstParent;
		}
		array.reverse();
		return array;
	}

	becomeHere() {
		if (this.hasChildren) {
			id_here.set(this.id);
			this.expand();
			id_showRevealCluster.set(null);
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

	order_normalizeRecursive(remoteWrite: boolean) {
		const children = this.children;
		if (children && children.length > 0) {
			orders_normalize_remoteMaybe(children, remoteWrite);
			for (const child of children) {
				child.order_normalizeRecursive(remoteWrite);
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
				this.log(DebugFlag.order, 'ORDER ' + oldOrder + ' => ' + newOrder);
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

	thing_isInDifferentBulkThan(other: Thing) {
		return this.baseID != other.baseID || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
	}

	async normalize_bulkFetchAll(baseID: string) {
		await dbDispatch.db.fetch_allFrom(baseID)
		await dbDispatch.db.hierarchy?.relationships_remoteCreateMissing(this);
		await dbDispatch.db.hierarchy?.relationships_removeHavingNullReferences();
		this.order_normalizeRecursive(true);
	}

	async redraw_bulkFetchAll_runtimeBrowseRight(grab: boolean = true) {
		this.expand();		// do this before fetch, so next launch will see it
		await this.normalize_bulkFetchAll(this.title);
		if (this.hasChildren) {
			if (grab) {
				this.children[0].grabOnly()
			}
			this.expand();
			signal_rebuild();
		}
	}

	redraw_remoteMoveup(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean) {
		const siblings = this.siblings;
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
				this.order_setTo(newOrder, false);
			}
			signal_rebuild();
		}
	}

	redraw_runtimeBrowseRight(RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		let newGrab: Thing | null = RIGHT ? this.firstChild : this.firstParent;
		const newGrabIsNotHere = get(id_here) != newGrab?.id;
		const newHere = RIGHT ? this : this.grandparent;
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
		}
		id_editing.set(null);
		newGrab?.grabOnly();
		const allowToBecomeHere = (!SHIFT || newGrab == this.firstParent) && newGrabIsNotHere; 
		const shouldBecomeHere = !newHere.isVisible || newHere.isRoot;
		if (!RIGHT && allowToBecomeHere && shouldBecomeHere) {
			newHere.becomeHere();
		} else if (!RIGHT || !this.hasChildren) {
			signal_rebuild();	// becomeHere also does this
		}
	}

}
