import { s_ancestry_focus, s_ancestries_grabbed, s_title_editing, s_layout_asClusters } from '../state/Stores';
import { k, u, get, Rect, Size, Thing, debug, signals, Wrapper, IDWrapper } from '../common/GlobalImports';
import { Predicate, Title, Relationship, PredicateKind, AlterationType } from '../common/GlobalImports';
import { s_ancestries_expanded, s_ancestry_editingTools, s_altering } from '../state/Stores';
import { Writable } from 'svelte/store';
import { h } from '../db/DBDispatch';

export default class Ancestry {
	wrappers: { [type: string]: Wrapper } = {};
	_thing: Thing | null = null;
	ancestryString: string;
	ancestryHash: number;
	idPredicate: string;
	unsubscribe: any;

	constructor(ancestryString: string = k.empty, idPredicate: string = Predicate.idContains) {
		this.ancestryHash = ancestryString.hash();
		this.ancestryString = ancestryString;
		this.idPredicate = idPredicate;
		if (h?.isAssembled) {
			this.unsubscribe = this.subscriptions_setup();			// not needed during hierarchy assembly
		}
	}

	destroy() {
		this.unsubscribe();
		this._thing = null;
	}

	signal_rebuildGraph()  { signals.signal_rebuildGraph(this); }
	signal_relayoutWidgets() { signals.signal_relayoutWidgets(this); }

	wrapper_add(wrapper: Wrapper) {
		this.wrappers[wrapper.type] = wrapper;
        h.wrapper_add(wrapper);
	}

	subscriptions_setup() {
		const title_unsubscribe = s_title_editing.subscribe(() => { this._thing?.updateColorAttributes(this); });
		const grab_unsubscribe = s_ancestries_grabbed.subscribe(() => { this._thing?.updateColorAttributes(this); });
		return () => {
			title_unsubscribe();
			grab_unsubscribe();
		}
	}

	static idPredicate_for(ancestryString: string): string {
		const hid = ancestryString.split(k.genericSeparator)[0].hash();	// grab first relationship's hid
		const relationship = h.relationship_forHID(hid);			// locate corresponding relationship
		return relationship?.idPredicate ?? '';						// grab its predicate id
	}
	
	static readonly $_PROPERTIES_$: unique symbol;
	
	get endID(): string { return this.idAt(); }
	get id_count():number { return this.ids.length; }
	get firstChild(): Thing { return this.children[0]; }
	get isRoot(): boolean { return this.ancestryHash == 0; }
	get lastChild(): Thing { return this.children.slice(-1)[0]; }
	get order(): number { return this.relationship?.order ?? -1; }
	get parentAncestry(): Ancestry | null { return this.stripBack(); }
	get ancestors(): Array<Thing> { return h.things_forAncestry(this); }
	get title(): string { return this.thing?.title ?? 'missing title'; }
	get isFocus(): boolean { return this.matchesStore(s_ancestry_focus); }
	get isExemplar(): boolean { return this.ancestryString == k.exemplar; }
	get ids_hashed(): Array<number> { return this.ids.map(i => i.hash()); }
	get relationship(): Relationship | null { return this.relationshipAt(); }
	get idBridging(): string | null { return this.thing?.idBridging ?? null; }
	get lineWrapper(): Wrapper | null { return this.wrappers[IDWrapper.line]; }
	get titleWrapper(): Wrapper | null { return this.wrappers[IDWrapper.title]; }
	get revealWrapper(): Wrapper | null { return this.wrappers[IDWrapper.reveal]; }
	get widgetWrapper(): Wrapper | null { return this.wrappers[IDWrapper.widget]; }
	get isGrabbed(): boolean { return this.includedInStore(s_ancestries_grabbed); }
	get titleRect(): Rect | null { return this.rect_ofWrapper(this.titleWrapper); }
	get predicate(): Predicate | null { return h.predicate_forID(this.idPredicate) }
	get toolsGrabbed(): boolean { return this.matchesStore(s_ancestry_editingTools); }
	get hasChildRelationships(): boolean { return this.childRelationships.length > 0; }
	get visibleProgeny_halfHeight(): number { return this.visibleProgeny_height() / 2; }
	get description(): string { return `${this.idPredicate} ${this.titles.join(':')}`; }
	get children(): Array<Thing> { return h.things_forAncestries(this.childAncestries); }
	get hasParentRelationships(): boolean { return this.parentRelationships.length > 0; }
	get visibleProgeny_halfSize(): Size { return this.visibleProgeny_size.dividedInHalf; }
	get idPredicates(): Array<string> { return this.relationships.map(r => r.idPredicate); }
	get isInvalid(): boolean { return this.containsReciprocals || this.containsMixedPredicates; }
	get childAncestries(): Array<Ancestry> { return this.childAncestries_for(this.idPredicate); }
	get siblingAncestries(): Array<Ancestry> { return this.parentAncestry?.childAncestries ?? []; }
	get showsChildRelationships(): boolean { return this.isExpanded && this.hasChildRelationships; }
	get isExpanded(): boolean { return this.isRoot || this.includedInStore(s_ancestries_expanded); }
	get isEditing(): boolean { return get(s_title_editing)?.editing?.matchesAncestry(this) ?? false; }
	get hasRelationships(): boolean { return this.hasParentRelationships || this.hasChildRelationships; }
	get titles(): Array<string> { return this.ancestors?.map(t => ` \"${t ? t.title : 'null'}\"`) ?? []; }
	get isStoppingEdit(): boolean { return get(s_title_editing)?.stopping?.matchesAncestry(this) ?? false; }
	get relatedThings(): Array<Thing> { return this.thing?.things_bidirectional_for(Predicate.idIsRelated) ?? []; }
	get visibleProgeny_size(): Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height()); }
	get childRelationships(): Array<Relationship> { return this.relationships_for_isChildOf(this.idPredicate, false); }
	get parentRelationships(): Array<Relationship> { return this.relationships_for_isChildOf(this.idPredicate, true); }
	get showsReveal(): boolean { return !get(s_layout_asClusters) && (this.hasChildRelationships || (this.thing?.isBulkAlias ?? false)); }

	get relationships(): Array<Relationship> {
		const relationships = this.ids_hashed.map(hid => h.relationship_forHID(hid)) ?? [];
		return u.strip_invalid(relationships);
	}
	
	get thing(): Thing | null {
		let thing = this._thing;
		if (!thing) {
			thing = this.thingAt(1) ?? null;	// always recompute, cache is for debugging
			this._thing = thing;
		}
		if (!!thing && !thing.oneAncestry) {
			thing.oneAncestry = this;
		}
		return this._thing;
	}

	get ids(): Array<string> {
		if (this.isRoot) {
			return [];
		}
		return this.ancestryString.split(k.genericSeparator);
	}

	get idThing(): string {
		if (this.isRoot) {
			return h.idRoot ?? k.id_unknown;
		}
		return this.relationship?.idChild ?? k.id_unknown;
	}

	get isVisible(): boolean {
		const focus = get(s_ancestry_focus);
		const asClusters = get(s_layout_asClusters);
		const incorporates = this.incorporates(focus);
		const expanded = this.isAllExpandedFrom(focus);
		const isRelatedTo_orContains = this.isRelatedTo_orContains(focus);
		return (incorporates && expanded) || (asClusters && isRelatedTo_orContains);
	}

	get hasGrandChildren(): boolean {
		if (this.hasChildRelationships) {
			for (const childAncestry of this.childAncestries) {
				if (childAncestry.hasChildRelationships) {
					return true;
				}
			}
		}
		return false;
	}

	get containsReciprocals(): boolean {
		let idChild: string | null =  null;
		let idParent: string | null =  null;
		for (const relationship of this.relationships) {
			if (!!idParent && !!idChild) {
				if (idParent == relationship.idChild && idChild == relationship.idParent) {
					return true;
				}
			}
			idChild = relationship.idChild;
			idParent = relationship.idParent;
		}
		return false;
	}

	get containsMixedPredicates(): boolean {
		let idPredicate: string | null = null;
		for (const relationship of this.relationships) {
			const relationshipIDPredicate = relationship.idPredicate;
			if (!idPredicate) {
				idPredicate = relationshipIDPredicate;
			}
			if (idPredicate &&
				(idPredicate != this.idPredicate ||
				![idPredicate, this.idPredicate].includes(relationshipIDPredicate))) {
				return true;
			}
		}
		return false;
	}

	get things_canAlter_asParentOf_toolsAncestry(): boolean {
		const altering = get(s_altering);
		const predicate = altering?.predicate;
		const isRelated = predicate?.kind == PredicateKind.isRelated ?? false;
		const toolsAncestry = get(s_ancestry_editingTools);
		const toolThing = toolsAncestry?.thing;
		const thing = this.thing;
		if (thing && toolThing && predicate && toolsAncestry && thing != toolThing && !toolsAncestry.matchesAncestry(this)) {
			const toolIsAnAncestor = isRelated ? false : thing.parentIDs.includes(toolThing.id);
			const isParentOfTool = this.thing_isImmediateParentOf(toolsAncestry, predicate.id);
			const isDeleting = altering.alteration == AlterationType.deleting;
			const isProgenyOfTool = this.ancestry_isAProgenyOf(toolsAncestry);
			return isDeleting ? isParentOfTool : !(isParentOfTool || isProgenyOfTool || toolIsAnAncestor);
		}
		return false;
	}

	matchesAncestry(ancestry: Ancestry): boolean { return this.ancestryHash == ancestry.ancestryHash; }
	includedInStore(store: Writable<Array<Ancestry>>): boolean { return this.includedInAncestries(get(store)); }
	includesPredicateID(idPredicate: string): boolean { return this.thing?.hasParentsFor(idPredicate) ?? false; }
	matchesStore(store: Writable<Ancestry | null>): boolean { return get(store)?.matchesAncestry(this) ?? false; }
	relationshipAt(back: number = 1): Relationship | null { return h.relationship_forHID(this.idAt(back).hash()) ?? null; }
	sharesAnID(ancestry: Ancestry | null): boolean { return !ancestry ? false : this.ids.some(id => ancestry.ids.includes(id)); }
	showsClusterFor(predicate: Predicate): boolean { return this.includesPredicateID(predicate.id) && this.hasThings(predicate); }
	rect_ofWrapper(wrapper: Wrapper | null): Rect | null { return Rect.createFromDOMRect(wrapper?.component.getBoundingClientRect()); }

	isRelatedTo_orContains(ancestry: Ancestry): boolean {
		// if ancestry.thing's parents (of all predicate kinds) include this.thing
		const id = this.thing?.id;
		const parents = ancestry.thing?.parents_ofAllKinds;
		if (id && parents) {
			return parents.filter(t => t.id == id).length > 0;
		}
		return false;
	}
	
	relationships_for_isChildOf(idPredicate: string, isChildOf: boolean) {
		const id = this.idBridging;				//  use idBridging in case thing is a bulk alias
		if (id && this.ancestryString != k.exemplar && ![k.empty, 'k.id_unknown'].includes(id)) {
			return h.relationships_forPredicateThingIsChild(idPredicate, id, isChildOf);
		}
		return [];
	}

	ancestry_isAProgenyOf(ancestry: Ancestry): boolean {
		let isAProgeny = false;
		ancestry.traverse((progenyAncestry: Ancestry) => {
			if (progenyAncestry.ancestryHash == this.ancestryHash) {
				isAProgeny = true;
				return true;	// stop traversal
			}
			return false;
		})
		return isAProgeny;
	}

	ancestry_ofNextSibling(increment: boolean): Ancestry | null {
		const array = this.siblingAncestries;
		const index = array.map(p => p.ancestryString).indexOf(this.ancestryString);
		if (index != -1) {
			let siblingIndex = index.increment(increment, array.length)
			if (index == 0) {
				siblingIndex = 1;
			}
			return array[siblingIndex];
		}
		return null;
	}

	childAncestries_for(idPredicate: string = Predicate.idContains): Array<Ancestry> {
		let ancestries: Array<Ancestry> = [];
		const isContains = idPredicate == Predicate.idContains;
		const childRelationships = this.relationships_for_isChildOf(idPredicate, false);
		if (childRelationships.length > 0) {
			for (const childRelationship of childRelationships) {		// loop through all child relationships
				if (childRelationship.idPredicate == idPredicate) {
					let ancestry: Ancestry | null;
					if (isContains) {
						ancestry = this.uniquelyAppendID(childRelationship.id); 	// add each childRelationship's id
					} else {
						ancestry = h.ancestry_remember_createUnique(childRelationship.id, idPredicate);
					}
					if (!!ancestry) {
						ancestries.push(ancestry);								// and push onto the ancestries
					}
				}
			}
			if (isContains) {											// normalize order of children only
				u.ancestries_orders_normalize_remoteMaybe(ancestries);
			}
		}
		return ancestries;
	}

	thingAt(back: number): Thing | null {			// 1 == last
		const relationship = this.relationshipAt(back);
		if (this.ancestryString != k.empty && relationship) {
			return relationship.child;
		}
		return h.root;	// N.B., h.root is wrong immediately after switching db type
	}

	thing_isImmediateParentOf(ancestry: Ancestry, id: string): boolean {
		const idThing = this.idThing;
		if (idThing != k.id_unknown) {
			const parents = ancestry.thing?.parents_forID(id);
			return parents?.map(t => t.id).includes(idThing) ?? false;
		}
		return false;
	}

	uniquelyAppendID(id: string): Ancestry | null {
		let ids = this.ids;
		ids.push(id);
		const ancestry = h.ancestry_remember_createUnique(ids.join(k.genericSeparator));
		if (ancestry) {
			if (ancestry.containsMixedPredicates) {
				h.ancestry_forget(ancestry);
				return null;
			}
			if (ancestry.containsReciprocals) {
				h.ancestry_forget(ancestry);
				return null;
			}
		}
		return ancestry;
	}

	includedInAncestries(ancestries: Array<Ancestry>): boolean {
		return (ancestries?.filter(p => {
			const ancestry = p as Ancestry;
			return ancestry && ancestry.matchesAncestry(this);
		}).length > 0) ?? false;
	}

	hasThings(predicate: Predicate): boolean {
		switch (predicate.kind) {
			case PredicateKind.contains:  return this.thing?.hasParentsFor(predicate.id) ?? false;
			case PredicateKind.isRelated: return this.hasRelationships;
			default:					  return false;
		}
	}

	idAt(back: number = 1): string {	// default 1 == last
		const ids = this.ids;
		if (back > ids.length) {
			return k.empty;
		}
		return ids.slice(-(Math.max(1, back)))[0];
	}

	dotColor(isInverted: boolean): string {
		const thing = this.thing;
		if (!!thing) {
			const showBorder = this.isGrabbed || this.isEditing || thing.isExemplar;
			if (isInverted != showBorder) {
				return thing.color;
			}
		}
		return k.color_background;
	}

	visibleParentAncestries(back: number = 1): Array<Ancestry> {
		const parentAncestries = this.thing?.parentAncestries ?? [];
		const ancestries: Array<Ancestry> = [];
		for (const parentAncestry of parentAncestries) {
			const ancestorAncestry = parentAncestry.stripBack(back);
			if (ancestorAncestry && ancestorAncestry.isVisible) {
				ancestries.push(parentAncestry);
			}
		}
		return ancestries;
	}

	stripBack(back: number = 1): Ancestry | null {
		if (back == 0) {
			return this;
		}
		const ids = this.ids.slice(0, -back);
		if (ids.length < 1) {
			return h.rootAncestry;
		}
		return h.ancestry_remember_createUnique(ids.join(k.genericSeparator));
	}

	appendChild(child: Thing | null): Ancestry | null {
		const idParent = this.thing?.idBridging;
		if (child && idParent) {
			const relationship = h.relationship_forPredicate_parent_child(Predicate.idContains, idParent, child.id);
			if (relationship) {
				return this.uniquelyAppendID(relationship.id);
			}
		}
		return null;
	}

	isAllExpandedFrom(targetAncestry: Ancestry | null): boolean {
		// visit ancestors until encountering
		// either this ancestry (???) or an unexpanded parent
		if (targetAncestry && !this.matchesAncestry(targetAncestry)) {
			const ancestry = this.parentAncestry;			// visit parent of ancestry
			if (!ancestry || (!ancestry.isExpanded && !ancestry.isAllExpandedFrom(targetAncestry))) {
				return false;	// stop when no ancestor or ancestor is not expanded
			}
		}
		return true;
	}

	things_childrenFor(idPredicate: string): Array<Thing> {
		const relationships = this.thing?.relationships_for_isChildOf(idPredicate, true);
		let children: Array<Thing> = [];
		if (!this.isRoot && relationships) {
			for (const relationship of relationships) {
				const parent = relationship.parent;
				if (!!parent) {
					children.push(parent);
				}
			}
		}
		return children;
	}

	ancestorsWithin(thresholdWidth: number): [number, number, Array<Thing>] {
		const ancestors = this.ancestors?.reverse() ?? [];
		const ancestorsThatFit: Array<Thing> = [];
		let distributedParentCount = 0;
		let numberOfParents = 0;	// do not include fat_polygon separator in width of crumb of first thing
		let totalWidth = 0;
		for (const ancestor of ancestors) {
			if (!!ancestor) {
				const crumbWidth = ancestor.crumbWidth(numberOfParents);
				if ((totalWidth + crumbWidth) > thresholdWidth) {
					break;
				}
				distributedParentCount = distributedParentCount * 10 + ancestor.parents.length;
				totalWidth += crumbWidth;
				ancestorsThatFit.push(ancestor);
			}
		}
		return [distributedParentCount, totalWidth, ancestorsThatFit.reverse()];
	}

	incorporates(ancestry: Ancestry | null): boolean {
		if (!!ancestry) {
			const ids = this.ids;
			const ancestryIDs = ancestry.ids;
			let index = 0;
			while (index < ancestryIDs.length) {
				if (ids[index] != ancestryIDs[index]) {
					return false;
				}
				index++;
			}
			return true;
		}
		return false;		
	}

	visibleProgeny_height(visited: Array<string> = []): number {
		const thing = this.thing;
		if (!!thing) {
			if (!visited.includes(this.ancestryString) && this.showsChildRelationships) {
				let height = 0;
				for (const childAncestry of this.childAncestries) {
					height += childAncestry.visibleProgeny_height([...visited, this.ancestryString]);
				}
				return Math.max(height, k.row_height);
			}
			return k.row_height;
		}
		return 0;
	}

	visibleProgeny_width(special: boolean = k.show_titleAtTop, visited: Array<number> = []): number {
		const thing = this.thing;
		if (!!thing) {
			const ancestryHash = this.ancestryHash;
			let width = special ? 0 : thing.titleWidth;
			if (!visited.includes(ancestryHash) && this.showsChildRelationships) {
				let progenyWidth = 0;
				for (const childAncestry of this.childAncestries) {
					const childProgenyWidth = childAncestry.visibleProgeny_width(false, [...visited, ancestryHash]);
					if (progenyWidth < childProgenyWidth) {
						progenyWidth = childProgenyWidth;
					}
				}
				width += progenyWidth + k.line_stretch + k.dot_size * (special ? 2 : 1);
			}
			return width;
		}
		return 0;
	}

	static readonly $_MUTATION_$: unique symbol;
	
	expand() { return this.expanded_setTo(true); }
	collapse() { return this.expanded_setTo(false); }
	toggleGrab() { if (this.isGrabbed) { this.ungrab(); } else { this.grab(); } }

	grabOnly() {
		s_ancestries_grabbed.set([this]);
		this.toggleToolsGrab();
	}

	becomeFocus(): boolean {
		const changed = !(get(s_ancestry_focus)?.matchesAncestry(this) ?? false);
		s_ancestry_editingTools.set(null);
		if (changed) {
			const grabbedAncestry = h.grabs.latestAncestryGrabbed(true)
			s_ancestry_focus.set(this);
			this.expand();
			if (!!grabbedAncestry && !grabbedAncestry.isVisible) {
				grabbedAncestry.ungrab()
				this.grab();
			}
		}
		return changed;
	}

	toggleToolsGrab() {
		const toolsAncestry = get(s_ancestry_editingTools);
		if (toolsAncestry) { // ignore if editingTools not in use
			if (this.matchesAncestry(toolsAncestry)) {
				s_ancestry_editingTools.set(null);
			} else if (!this.isRoot) {
				s_ancestry_editingTools.set(this);
			}
		}
	}

	async assureIsVisible() {
		// visit and expand each parent until this
		let ancestry: Ancestry | null = this;
		do {
			ancestry = ancestry?.parentAncestry ?? null;
			if (!!ancestry) {
				if (!!ancestry.isVisible) {
					ancestry.becomeFocus();
					return;
				}
				ancestry.expand();
			}
		} while (!ancestry);
		h.rootAncestry.expand();
		h.rootAncestry.becomeFocus();
	}

	handle_singleClick_onDragDot(shiftKey: boolean) {
        if (!this.isExemplar) {
			s_title_editing?.set(null);
			if (get(s_layout_asClusters)) {
				this.becomeFocus();
			} else {
				if (get(s_altering)) {
					h.ancestry_alterMaybe(this);
				} else if (shiftKey || this.isGrabbed) {
					this.toggleGrab();
				} else {
					this.grabOnly();
				}
			}
			signals.signal_rebuildGraph_fromFocus();
        }
	}

	grab() {
		s_ancestries_grabbed.update((array) => {
			if (!!array) {
				const index = array.indexOf(this);
				if (array.length == 0) {
					array.push(this);
				} else if (index != array.length - 1) {	// not already last?
					if (index != -1) {					// found: remove
						array.splice(index, 1);
					}
					array.push(this);					// always add last
				}
			}
			return array;
		});
		this.toggleToolsGrab();
	}

	ungrab() {
		const rootAncestry = h.rootAncestry;
		s_ancestries_grabbed.update((array) => {
			if (!!array) {
				const index = array.indexOf(this);
				if (index != -1) {				// only splice array when item is found
					array.splice(index, 1);		// 2nd parameter means remove one item only
				}
				if (array.length == 0) {
					array.push(rootAncestry);
				}
			}
			return array;
		});
		let ancestries = get(s_ancestries_grabbed) ?? [];
		if (ancestries.length == 0) {
			rootAncestry.grabOnly();
		} else {
			this.toggleToolsGrab(); // do not show tools editingTools for root
		}
	}

	async order_normalizeRecursive_remoteMaybe(remoteWrite: boolean, visited: Array<number> = []) {
		const hid = this.ancestryHash;
		const childAncestries = this.childAncestries;
		if (!visited.includes(hid) && childAncestries && childAncestries.length > 1) {
			await u.ancestries_orders_normalize_remoteMaybe(childAncestries, remoteWrite);
			for (const childAncestry of childAncestries) {
				childAncestry.order_normalizeRecursive_remoteMaybe(remoteWrite, [...visited, hid]);
			}
		}
	}
	
	expanded_setTo(expand: boolean) {
		let mutated = false;
		if (!this.isRoot) {
			s_ancestries_expanded.update((array) => {
				if (array) {
					const index = array.map(s => s.ancestryString).indexOf(this.ancestryString);
					const found = index != -1;
					if (expand && !found) {		// only add if not already added
						array.push(this);
						mutated = true;
					}
					if (found && !expand) {		// only remove found item
						array.splice(index, 1);	// 1 means 'remove one item only'
						mutated = true;
					}
				}
				return array;
			});
		}
		return mutated;
	}

	startEdit() {
		if (!this.isRoot && k.allow_TitleEditing) {
			debug.log_edit(`EDIT ${this.description}`)
			this.grabOnly();
			s_title_editing.set(new Title(this));
		}
	}

	async traverse_async(applyTo: (ancestry: Ancestry) => Promise<boolean>) {
		if (!await applyTo(this)) {
			for (const childAncestry of this.childAncestries) {
				await childAncestry.traverse_async(applyTo);
			}
		}
	}

	traverse(applyTo: (ancestry: Ancestry) => boolean) {
		if (!applyTo(this)) {
			for (const childAncestry of this.childAncestries) {
				childAncestry.traverse(applyTo);
			}
		}
	}

}
