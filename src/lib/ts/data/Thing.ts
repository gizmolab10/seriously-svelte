import { get, Size, Datum, signal, Signals, constants, Predicate, PersistID, dbDispatch, getWidthOf, persistLocal, normalizeOrderOf } from '../common/GlobalImports';
import { idHere, idEditing, expanded, idsGrabbed, lineGap } from '../managers/State';
import Airtable from 'airtable';

export default class Thing extends Datum {
	hoverAttributes = '';
	borderAttribute = '';
	grabAttributes = '';
	isExemplar = false;
	isEditing = false;
	isGrabbed = false;
	titlePadding = 0;
	dbType: string;
	title: string;
	color: string;
	trait: string;
	order: number;

	constructor(id: string = Datum.newID, title = constants.defaultTitle, color = 'blue', trait = 's', order = 0, isRemotelyStored: boolean) {
		super(id, isRemotelyStored);
		this.dbType = dbDispatch.db.dbType;
		this.title = title;
		this.color = color;
		this.trait = trait;
		this.order = order;

		this.updateColorAttributes();

		idEditing.subscribe((id: string | null) => { // executes whenever idEditing changes
			const isEditing = (id == this.id);
			if (this.isEditing != isEditing) {
				this.isEditing = isEditing;
				this.updateColorAttributes();
			}
		});

		idsGrabbed.subscribe((ids: string[] | undefined) => { // executes whenever idsGrabbed changes
			const isGrabbed = (ids != undefined) && ids.includes(this.id);
			if (this.isGrabbed != isGrabbed) {
				this.isGrabbed = isGrabbed;
				this.updateColorAttributes();
			}
		});
	};

	get description():				string { return this.id + ' (\" ' + this.title + '\") '; }
	get titleWidth():				number { return getWidthOf(this.title) }
	get halfVisibleProgenyHeight(): number { return this.visibleProgenyHeight / 2; }
	get hasChildren():			   boolean { return this.hasPredicate(false); }
	get isRoot():				   boolean { return this == dbDispatch.db.hierarchy.root; }
	get showBorder():			   boolean { return this.isGrabbed || this.isEditing || this.isExemplar; }
	get isExpanded():			   boolean { return this.isRoot || get(expanded).includes(this.parentRelationshipID); }
	get fields():		 Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get children():			  Array<Thing> { const id = Predicate.idIsAParentOf; return dbDispatch.db.hierarchy.getThings_byIDPredicateToAndID(id, false, this.id); }
	get parents():			  Array<Thing> { const id = Predicate.idIsAParentOf; return dbDispatch.db.hierarchy.getThings_byIDPredicateToAndID(id,	true, this.id); }
	get siblings():			  Array<Thing> { return this.firstParent?.children ?? []; }
	get grandparent():				 Thing { return this.firstParent?.firstParent ?? dbDispatch.db.hierarchy.root; }
	get lastChild():				 Thing { return this.children.slice(-1)[0]; }
	get firstChild():				 Thing { return this.children[0]; }
	get firstParent():				 Thing { return this.parents[0]; }

	get parentRelationshipID(): string { // WRONG
		return dbDispatch.db.hierarchy.getRelationship_whereIDEqualsTo(this.id, true)?.id ?? '';
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
	persistExpanded()	 { persistLocal.writeToKey(PersistID.expanded, get(expanded)); }
	toggleGrab()		 { dbDispatch.db.hierarchy.grabs.toggleGrab(this); }
	grabOnly()			 { dbDispatch.db.hierarchy.grabs.grabOnly(this); }
	toggleExpand()		 { this.setExpanded(!this.isExpanded) }
	collapse()			 { this.setExpanded(false); }
	expand()			 { this.setExpanded(true); }

	hasPredicate(asParents: boolean): boolean {
		return asParents ? this.parents.length > 0 : this.children.length > 0
	}

	revealColor(isReveal: boolean): string {
		return (this.showBorder != isReveal) ? this.color : constants.backgroundColor;
	}

	startEdit() {
		if (this != dbDispatch.db.hierarchy.root) {
			idEditing.set(this.id);
		}
	}

	copyInto(other: Thing) {
		other.title = this.title;
		other.color = this.color;
		other.trait = this.trait;
		other.order = this.order;
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
	
	setExpanded(expand: boolean) {
		const relationship = dbDispatch.db.hierarchy.getRelationship_whereIDEqualsTo(this.id);
		if (relationship) {
			expanded.update((array) => {
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
				return array;
			});
			this.persistExpanded();
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
			persistLocal.writeToKey(PersistID.here, id);
			signal(Signals.childrenOf, id);
		};
	}

	normalizeOrder_recursive(remoteWrite: boolean) {
		const children = this.children;
		if (children && children.length > 0) {
			normalizeOrderOf(children, remoteWrite);
			for (const child of children) {
				child.normalizeOrder_recursive(remoteWrite);
			}
		}
	}

	async setOrderTo(newOrder: number, remoteWrite: boolean) {
		if (this.order != newOrder) {
			this.order = newOrder;
			const relationship = dbDispatch.db.hierarchy.getRelationship_whereIDEqualsTo(this.id);
			if (relationship && (relationship.order != newOrder)) {
				relationship.order = newOrder;
				if (remoteWrite) {
					setTimeout(() => {
						(async () => {
							await dbDispatch.relationship_remoteWrite(relationship);
						})();
					}, 100);
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

	redraw_remoteMoveup(up: boolean, expand: boolean, relocate: boolean, extreme: boolean) {
		const siblings = this.siblings;
		if (!siblings || siblings.length == 0) {
				this.redraw_browseRight(true, extreme, up);
		} else {
			const index = siblings.indexOf(this);
			const newIndex = index.increment(!up, siblings.length);
			if (relocate) {
				const wrapped = up ? (index == 0) : (index == siblings.length - 1);
				const goose = ((wrapped == up) ? 1 : -1) * constants.orderIncrement;
				const newOrder =	newIndex + goose;
				siblings[index].setOrderTo(newOrder, true);
				normalizeOrderOf(siblings);
				signal(Signals.childrenOf, this.firstParent.id);
			} else {
				const newGrab = siblings[newIndex];
				if (expand) {
					newGrab?.toggleGrab()
				} else {
					newGrab?.grabOnly();
				}
			}
		}
	}

	redraw_browseRight(right: boolean, generational: boolean, extreme: boolean, toTop: boolean = false, moveHere: boolean = false) {
		let newGrab: Thing | null = right ? toTop ? this.lastChild : this.firstChild : this.firstParent;
		if (!right) {
			if (generational) {
				if (this.isExpanded) {
					this.collapse();
					newGrab = null;
				} else {
					this.firstParent?.collapse();
				}
				signal(Signals.childrenOf, null);			// tell graph to update line rects
			}
		} else if (this.hasChildren) {
			if (generational) {
				newGrab = null;
			}
			this.expand();
			signal(Signals.childrenOf, null);			// tell graph to update line rects
		}
		if (moveHere || (!right && this.id == get(idHere))) {
			const newHere = right ? this : this.grandparent;
			newHere.becomeHere();
		}
		idEditing.set(null);
		newGrab?.grabOnly();
	}

}
