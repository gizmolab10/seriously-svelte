import {noop} from 'svelte/internal';
import { k, get, Size, Datum, signal, Signals, Predicate, PersistID, dbDispatch, getWidthOf, persistLocal, orders_normalize_remoteMaybe, Hierarchy, TraitType } from '../common/GlobalImports';
import { idHere, idEditing, expanded, idsGrabbed, lineGap, lineStretch, dotDiameter } from '../managers/State';
import Airtable from 'airtable';

export default class Thing extends Datum {
	needsBulkFetch = false;
	hoverAttributes = '';
	borderAttribute = '';
	grabAttributes = '';
	isExemplar = false;
	isEditing = false;
	isGrabbed = false;
	dbType: string;
	title: string;
	color: string;
	trait: string;
	order: number;

	static thing_runtimeCreate(inBulkName: string, from: Thing) {
		return new Thing(inBulkName, null, from.title, from.color, from.trait, from.order, false);
	}

	constructor(bulkName: string, id: string | null, title = k.defaultTitle, color = 'blue', trait = 's', order = 0, isRemotelyStored: boolean) {
		super(bulkName, id, isRemotelyStored);
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
	};

	get hierarchy():			 Hierarchy { return dbDispatch.db.hierarchy; }
	get description():				string { return this.id + ' (\" ' + this.title + '\") '; }
	get visibleProgenySize():		  Size { return new Size(this.visibleProgenyWidth, this.visibleProgenyHeight); }
	get halfVisibleProgenySize():	  Size { return this.visibleProgenySize.dividedInHalf; }
	get halfVisibleProgenyHeight(): number { return this.visibleProgenyHeight / 2; }
	get halfVisibleProgenyWidth():  number { return this.visibleProgenyWidth / 2; }
	get titleWidth():				number { return getWidthOf(this.title) }
	get hasChildren():			   boolean { return this.hasPredicate(false); }
	get isRoot():				   boolean { return this == this.hierarchy.root; }
	get isBulkAlias():			   boolean { return this.trait == TraitType.bulk; }
	get showBorder():			   boolean { return this.isGrabbed || this.isEditing || this.isExemplar; }
	get isExpanded():			   boolean { return this.isRoot || get(expanded)?.includes(this.parentRelationshipID); }
	get isVisible():			   boolean { return this.ancestors(Number.MAX_SAFE_INTEGER).includes(this.hierarchy.here!); }
	get grandparent():				 Thing { return this.firstParent?.firstParent ?? this.hierarchy.root; }
	get lastChild():				 Thing { return this.children.slice(-1)[0]; }
	get firstChild():				 Thing { return this.children[0]; }
	get firstParent():				 Thing { return this.parents[0]; }
	get siblings():			  Array<Thing> { return this.firstParent?.children ?? []; }
	get children():			  Array<Thing> { const idP = Predicate.idIsAParentOf; return this.hierarchy.things_getByIDPredicateToAndID(idP, false, this.id); }
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
		const dotWidth = get(dotDiameter);
		let width = this.titleWidth + dotWidth + 18;
		if (this.hasChildren && this.isExpanded) {
			let progenyWidth = 0;
			for (const child of this.children) {
				let childProgenyWidth = child.visibleProgenyWidth;
				if (childProgenyWidth > progenyWidth) {
					progenyWidth = childProgenyWidth;
				}
			}
			width += progenyWidth + get(lineStretch);
		}
		return width;
	}

	get visibleProgenyHeight(): number {

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
		
		let height = get(lineGap);		// default row height
		if (this.hasChildren && this.isExpanded) {
			height = 0;
			for (const child of this.children) {
				height += child.visibleProgenyHeight;
			}
		}
		return height;
	}

	log(message: string) { console.log(message, this.description); }
	toggleGrab()		 { this.hierarchy.grabs.toggleGrab(this); }
	grabOnly()			 { this.hierarchy.grabs.grabOnly(this); }
	toggleExpand()		 { this.expanded_setTo(!this.isExpanded) }
	collapse()			 { this.expanded_setTo(false); }
	expand()			 { this.expanded_setTo(true); }

	hasPredicate(asParents: boolean): boolean {
		return asParents ? this.parents.length > 0 : this.children.length > 0
	}

	revealColor(isReveal: boolean): string {
		return (this.showBorder != isReveal) ? this.color : k.backgroundColor;
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
			signal(Signals.dots, this.id);
		}
	}

	ancestors(thresholdWidth: number): Array<Thing> {
		let thing: Thing = this;
		let totalWidth = 0;
		const array = [];
		while (thing) {
			const width = thing.titleWidth + 5;				// 5 for the '>' separator
			if (totalWidth + width > thresholdWidth) {
				break;
			}
			totalWidth += width;
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
			signal(Signals.childrenOf, id);
			persistLocal.writeToDBKey(PersistID.here, id)
		};
	}

	hasSameChildrenIDsAs(children: Array<Thing>) {
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

	order_setTo(newOrder: number, remoteWrite: boolean) {
		if (this.order != newOrder) {
			this.order = newOrder;
			// console.log('ORDER:', this.title, newOrder, 'in', this.firstParent.title);
			const relationship = this.hierarchy.relationship_getWhereIDEqualsTo(this.id);
			if (relationship && (relationship.order != newOrder)) {
				relationship.order = newOrder;
				if (remoteWrite) {
					relationship.remoteWrite();
				}
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

	async redraw_fetchAll_runtimeBrowseRight(grab: boolean = true) {
		this.expand();		// do this before fetch, so next launch will see it
		await dbDispatch.db.fetch_allFrom(this.title)
		this.order_normalizeRecursive(true);
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
				const goose = ((wrapped == up) ? 1 : -1) * k.orderIncrement;
				const newOrder =	newIndex + goose;
				siblings[index].order_setTo(newOrder, false);
				orders_normalize_remoteMaybe(siblings);
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
						newGrab.expand();
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
