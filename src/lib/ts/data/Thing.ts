import { k, get, Size, Datum, signal, Signals, debug, DebugOption, Predicate, PersistID, Hierarchy } from '../common/GlobalImports';
import { TraitType, dbDispatch, getWidthOf, persistLocal, orders_normalize_remoteMaybe } from '../common/GlobalImports';
import { idHere, idEditing, expanded, idsGrabbed, lineGap, idShowRevealCluster } from '../managers/State';
import Airtable from 'airtable';

export default class Thing extends Datum {
    bulkRootID: string = '';
	needsBulkFetch = false;
	hoverAttributes = '';
	borderAttribute = '';
	grabAttributes = '';
	showCluster = false;
	isExemplar = false;
	isEditing = false;
	isGrabbed = false;
	dbType: string;
	title: string;
	color: string;
	trait: string;
	order: number;

	static thing_runtimeCopy(inBulkName: string, from: Thing) {
		return new Thing(inBulkName, null, from.title, from.color, from.trait, from.order, false);
	}

	constructor(bulkID: string, id: string | null, title = k.defaultTitle, color = 'blue', trait = 's', order = 0, isRemotelyStored: boolean) {
		super(bulkID, id, isRemotelyStored);
		this.dbType = dbDispatch.db.dbType;
		this.title = title;
		this.color = color;
		this.trait = trait;
		this.order = order;

		this.updateColorAttributes();

		idEditing.subscribe((idEdit: string | null) => {
			const isEditing = (idEdit == this.id);
			if (this.isEditing != isEditing) {
				this.isEditing  = isEditing;
				this.updateColorAttributes();
			}
		});

		idsGrabbed.subscribe((idsGrab: string[] | undefined) => {
			const isGrabbed = (idsGrab != undefined) && idsGrab.includes(this.id);
			if (this.isGrabbed != isGrabbed) {
				this.isGrabbed  = isGrabbed;
				this.updateColorAttributes();
			}
		});

		idShowRevealCluster.subscribe((idCluster: string | null) => {
			const shouldShow = (idCluster != undefined) && idCluster == this.id;
			if (this.showCluster != shouldShow) {
				this.showCluster = shouldShow;
				signal(Signals.childrenOf);
			}
		});
	};

	get hierarchy():			 Hierarchy { return dbDispatch.db.hierarchy; }
	get description():				string { return this.id + ' \"' + this.title + '\"'; }
	get idForChildren():            string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get visibleProgenySize():		  Size { return new Size(this.visibleProgenyWidth, this.visibleProgenyHeight()); }
	get halfVisibleProgenySize():	  Size { return this.visibleProgenySize.dividedInHalf; }
	get halfVisibleProgenyHeight(): number { return this.visibleProgenyHeight() / 2; }
	get titleWidth():				number { return getWidthOf(this.title) }
	get hasChildren():			   boolean { return this.hasPredicate(false); }
	get hasParents():			   boolean { return this.hasPredicate(true); }
	get isHere():				   boolean { return this.id == get(idHere); }
	get isRoot():				   boolean { return this == this.hierarchy.root; }
	get isBulkAlias():			   boolean { return this.trait == TraitType.bulk; }
	get isExpanded():			   boolean { return this.isRoot || get(expanded)?.includes(this.parentRelationshipID); }
	get isVisible():			   boolean { return this.ancestors(Number.MAX_SAFE_INTEGER).includes(this.hierarchy.here!); }
	get grandparent():				 Thing { return this.firstParent?.firstParent ?? this.hierarchy.root; }
	get lastChild():				 Thing { return this.children.slice(-1)[0]; }
	get firstChild():				 Thing { return this.children[0]; }
	get firstParent():				 Thing { return this.parents[0]; }
	get siblings():			  Array<Thing> { return this.firstParent?.children ?? []; }
	get children():			  Array<Thing> { const idP = Predicate.idIsAParentOf; return this.hierarchy.things_getByIDPredicateToAndID(idP, false, this.idForChildren); }
	get parents():			  Array<Thing> { const idP = Predicate.idIsAParentOf; return this.hierarchy.things_getByIDPredicateToAndID(idP,	true, this.id); }
	get fields():		 Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }

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

	get visibleProgenyWidth(): number {
		let width = this.titleWidth;
		if (this.hasChildren && this.isExpanded) {
			let progenyWidth = 0;
			for (const child of this.children) {
				let childProgenyWidth = child.visibleProgenyWidth;
				if (childProgenyWidth > progenyWidth) {
					progenyWidth = childProgenyWidth;
				}
			}
			width += progenyWidth;
		}
		return width;
	}

	visibleProgenyHeight(includeCluster: boolean = true): number {

		//////////////////////////////////////////////////
		//												//
		//			lineGap gives the height			//
		//												//
		//					   OR						//
		//												//
		//		 this has children & is expanded		//
		//	so, add each child's visibleProgenyHeight	//
		//												//
		//////////////////////////////////////////////////
		
		let height = 0;
		let singleHeight = this.showCluster ? k.clusterHeight + 6 : get(lineGap);		// default row height
		if (this.hasChildren && this.isExpanded) {
			if (this.children.length < 3 && !includeCluster) {
				singleHeight = get(lineGap);
			}
			for (const child of this.children) {
				height += child.visibleProgenyHeight();
			}
		}
		return Math.max(height, singleHeight);
	}
	
	toggleGrab()		 { this.hierarchy.grabs.toggleGrab(this); }
	grabOnly()			 { this.hierarchy.grabs.grabOnly(this); }
	toggleExpand()		 { this.expanded_setTo(!this.isExpanded) }
	collapse()			 { this.expanded_setTo(false); }
	expand()			 { this.expanded_setTo(true); }

	hasPredicate(asParents: boolean): boolean {
		return asParents ? this.parents.length > 0 : this.children.length > 0
	}

	log(option: DebugOption, message: string) {
		debug.log(option, message + ' ' + this.description);
	}

	revealColor(isReveal: boolean): string {
		const showBorder = this.isGrabbed || this.isEditing || this.isExemplar;
		const useThingColor = isReveal != showBorder;
		return useThingColor ? this.color : k.backgroundColor;
	}

	startEdit() {
		if (this != this.hierarchy.root) {
			idEditing.set(this.id);
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
			signal(Signals.childrenOf, this.firstParent.id);
			signal(Signals.dots, this.id);
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
			const id = this.id;
			idHere.set(id);
			this.expand();
			idShowRevealCluster.set(null);
			signal(Signals.childrenOf, id);
			persistLocal.writeToDBKey(PersistID.here, id)
		};
	}

	childrenIDs_oneMatchesIDOf(children: Array<Thing>) {
		if (this.children.length != children.length) {
			return false;
		}
		const tIDs = this.children.map(c => c.id);
		for (const child of children) {
			if (!tIDs.includes(child.id)) {
				return false;
			}
		}
		return true;
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
				this.log(DebugOption.order, 'ORDER ' + oldOrder + ' => ' + newOrder);
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
		return this.bulkID != other.bulkID || (other.isBulkAlias && !this.isBulkAlias && this.bulkID != other.title);
	}

	async normalize_bulkFetchAll(bulkID: string) {
		await dbDispatch.db.fetch_allFrom(bulkID)
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
			signal(Signals.childrenOf);
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
				signal(Signals.childrenOf, this.firstParent.id);
			}
		}
	}

	redraw_runtimeBrowseRight(RIGHT: boolean, SHIFT: boolean, EXTREME: boolean, fromReveal: boolean = false) {
		let newGrab: Thing | null = RIGHT ? this.firstChild : this.firstParent;
		const newHere = RIGHT ? this : this.grandparent;
		if (!RIGHT) {
			const root = this.hierarchy.root;
			if (EXTREME) {
				root?.becomeHere();	// tells graph to update line rects
			} else {
				if (!SHIFT) {
					if (fromReveal) {
						this.expand();
					} else {
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
		const allowToBecomeHere = !SHIFT || newGrab == this.firstParent; 
		const shouldBecomeHere = !newHere.isVisible || newHere.isRoot;
		if (!RIGHT && allowToBecomeHere && shouldBecomeHere) {
			newHere.becomeHere();
		}
		idEditing.set(null);
		newGrab?.grabOnly();
		signal(Signals.childrenOf);			// tell graph to update line rects
	}

}
