import { s_expanded_ancestries, s_showing_tools_ancestry, s_alteration_mode, s_clusters_geometry } from '../state/Reactive_State';
import { g, k, u, get, show, Rect, Size, Thing, debug, signals, wrappers, Predicate } from '../common/Global_Imports';
import { s_focus_ancestry, s_grabbed_ancestries, s_edit_state, s_show_rings } from '../state/Reactive_State';
import { Title_State, ElementType, Paging_State, Relationship, PredicateKind } from '../common/Global_Imports';
import { Svelte_Wrapper, Widget_MapRect, AlterationType, SvelteComponentType } from '../common/Global_Imports';
import Identifiable from '../basis/Identifiable';
import { Writable } from 'svelte/store';
import { h } from '../db/DBDispatch';

export default class Ancestry extends Identifiable {
	_thing: Thing | null = null;
	idPredicate: string;
	isNormal = true;
	unsubscribe: any;

	// id => ancestry string 
	//	composed of ids of each relationship
	// NOTE: first relationship's parent is always the root
	//   "   idPredicate is from the last relationship

	constructor(ancestryString: string = k.empty, idPredicate: string = Predicate.idContains, isNormal: boolean = true) {
		super(ancestryString);
		this.isNormal = isNormal;
		this.idPredicate = idPredicate;
	}

	destroy() {
		this.unsubscribe();
		this._thing = null;
	}

	signal_rebuildGraph()  { signals.signal_rebuildGraph(this); }
	signal_relayoutWidgets() { signals.signal_relayoutWidgets(this); }
	
	static readonly $_PROPERTIES_$: unique symbol;
	
	get endID(): string { return this.idAt(); }
	get id_count():number { return this.ids.length; }
	get firstChild(): Thing { return this.children[0]; }
	get isRoot(): boolean { return this.idHashed == 0; }
	get lastChild(): Thing { return this.children.slice(-1)[0]; }
	get order(): number { return this.relationship?.order ?? -1; }
	get parentAncestry(): Ancestry | null { return this.stripBack(); }
	get ancestors(): Array<Thing> { return h.things_forAncestry(this); }
	get title(): string { return this.thing?.title ?? 'missing title'; }
	get isFocus(): boolean { return this.matchesStore(s_focus_ancestry); }
	get ids_hashed(): Array<number> { return this.ids.map(i => i.hash()); }
	get relationship(): Relationship | null { return this.relationshipAt(); }
	get idBridging(): string | null { return this.thing?.idBridging ?? null; }
	get titleRect(): Rect | null { return this.rect_ofWrapper(this.titleWrapper); }
	get predicate(): Predicate | null { return h.predicate_forID(this.idPredicate) }
	get toolsGrabbed(): boolean { return this.matchesStore(s_showing_tools_ancestry); }
	get hasChildRelationships(): boolean { return this.childRelationships.length > 0; }
	get visibleProgeny_halfHeight(): number { return this.visibleProgeny_height() / 2; }
	get description(): string { return `${this.idPredicate} ${this.titles.join(':')}`; }
	get children(): Array<Thing> { return h.things_forAncestries(this.childAncestries); }
	get hasParentRelationships(): boolean { return this.parentRelationships.length > 0; }
	get visibleProgeny_halfSize(): Size { return this.visibleProgeny_size.dividedInHalf; }
	get idPredicates(): Array<string> { return this.relationships.map(r => r.idPredicate); }
	get isGrabbed(): boolean { return this.includedInStore_ofAncestries(s_grabbed_ancestries); }
	get isInvalid(): boolean { return this.containsReciprocals || this.containsMixedPredicates; }
	get siblingIndex(): number { return this.siblingAncestries.map(p => p.id).indexOf(this.id); }
	get childAncestries(): Array<Ancestry> { return this.childAncestries_for(this.idPredicate); }
	get siblingAncestries(): Array<Ancestry> { return this.parentAncestry?.childAncestries ?? []; }
	get showsChildRelationships(): boolean { return this.isExpanded && this.hasChildRelationships; }
	get isEditing(): boolean { return get(s_edit_state)?.editing?.matchesAncestry(this) ?? false; }
	get hasRelationships(): boolean { return this.hasParentRelationships || this.hasChildRelationships; }
	get titles(): Array<string> { return this.ancestors?.map(t => ` \"${t ? t.title : 'null'}\"`) ?? []; }
	get isStoppingEdit(): boolean { return get(s_edit_state)?.stopping?.matchesAncestry(this) ?? false; }
	get widget_map(): Widget_MapRect | null { return get(s_clusters_geometry)?.widget_mapFor(this) ?? null; }
	get isExpanded(): boolean { return this.isRoot || this.includedInStore_ofAncestries(s_expanded_ancestries); }
	get visibleProgeny_size(): Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height()); }
	get childRelationships(): Array<Relationship> { return this.relationships_for_isChildOf(this.idPredicate, false); }
	get parentRelationships(): Array<Relationship> { return this.relationships_for_isChildOf(this.idPredicate, true); }
	get titleWrapper(): Svelte_Wrapper | null { return wrappers.wrapper_forHID_andType(this.idHashed, SvelteComponentType.title); }
	get showsReveal(): boolean { return !get(s_show_rings) && (this.hasChildRelationships || (this.thing?.isBulkAlias ?? false)); }

	get relationships(): Array<Relationship> {
		const relationships = this.ids_hashed.map(hid => h.relationship_forHID(hid)) ?? [];
		return u.strip_invalid(relationships);
	}

	get ids(): Array<string> {
		if (this.isRoot) {
			return [];
		}
		return this.id.split(k.generic_separator);
	}

	get idThing(): string {
		if (this.isRoot) {
			return h.idRoot ?? k.unknown;
		}
		return this.relationship?.idChild ?? k.unknown;
	}

	get paging_state(): Paging_State | null {
		const predicate = this.predicate;
		const geometry = get(s_clusters_geometry);
		if (!!predicate && !!geometry) {
			const map = geometry?.cluster_map_for(this.isNormal, predicate)
			return map?.paging_state_ofAncestry(this) ?? null;
		}
		return null;	// either geometry is not setup or predicate id is bogus
	}
	
	get thing(): Thing | null {
		let thing = this._thing;
		if (!thing) {
			thing = this.thingAt(1) ?? null;	// always recompute, cache is for debugging
			this._thing = thing;
		}
		if (!!thing && !thing.oneAncestry && !!this.predicate && !this.predicate.isBidirectional) {
			thing.oneAncestry = this;
		}
		return this._thing;
	}

	get isVisible(): boolean {
		if (!!get(s_show_rings)) {
			return this.parentAncestry?.paging_state?.index_isVisible(this.siblingIndex) ?? false;
		} else {
			const focus = get(s_focus_ancestry);
			const incorporates = this.incorporates(focus);
			const expanded = this.isAllExpandedFrom(focus);
			return (incorporates && expanded);
		}
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
			if (!!idPredicate &&
				(idPredicate != this.idPredicate ||
				![idPredicate, this.idPredicate].includes(relationshipIDPredicate))) {
				return true;
			}
		}
		return false;
	}

	get canConnect_toToolsAncestry(): boolean {
		const alteration = get(s_alteration_mode);
		const predicate = alteration?.predicate;
		if (!!alteration && !!predicate) {
			const toolsAncestry = get(s_showing_tools_ancestry);
			const toolThing = toolsAncestry?.thing;
			const thing = this.thing;
			if (!!thing && !!toolThing && !!toolsAncestry) {
				if (thing.idHashed != toolThing.idHashed && !toolsAncestry.matchesAncestry(this)) {
					const isRelated = predicate.kind == PredicateKind.isRelated;
					const toolIsAnAncestor = isRelated ? false : thing.parentIDs.includes(toolThing.id);
					const isParentOfTool = this.thing_isImmediateParentOf(toolsAncestry, predicate.id);
					const isProgenyOfTool = this.ancestry_isAProgenyOf(toolsAncestry);
					const isDeleting = alteration.type == AlterationType.deleting;
					const doNotAlter_forIsNotDeleting = isParentOfTool || isProgenyOfTool || toolIsAnAncestor;
					const canAlter = isDeleting ? isParentOfTool : !doNotAlter_forIsNotDeleting;
					return canAlter
				}
			}
		}
		return false;
	}

	matchesAncestry(ancestry: Ancestry): boolean { return this.idHashed == ancestry.idHashed; }
	rect_ofWrapper(wrapper: Svelte_Wrapper | null): Rect | null { return wrapper?.boundingRect ?? null; }
	includesPredicateID(idPredicate: string): boolean { return this.thing?.hasParentsFor(idPredicate) ?? false; }
	matchesStore(store: Writable<Ancestry | null>): boolean { return get(store)?.matchesAncestry(this) ?? false; }
	relationshipAt(back: number = 1): Relationship | null { return h.relationship_forHID(this.idAt(back).hash()) ?? null; }
	includedInStore_ofAncestries(store: Writable<Array<Ancestry>>): boolean { return this.includedInAncestries(get(store)); }
	sharesAnID(ancestry: Ancestry | null): boolean { return !ancestry ? false : this.ids.some(id => ancestry.ids.includes(id)); }
	showsClusterFor(predicate: Predicate): boolean { return this.includesPredicateID(predicate.id) && this.hasThings(predicate); }
	
	relationships_for_isChildOf(idPredicate: string, isChildOf: boolean) {
		return this.thing?.relationships_for_isChildOf(idPredicate, isChildOf) ?? [];
	}

	ancestry_isAProgenyOf(ancestry: Ancestry): boolean {
		let isAProgeny = false;
		ancestry.traverse((progenyAncestry: Ancestry) => {
			if (progenyAncestry.idHashed == this.idHashed) {
				isAProgeny = true;
				return true;	// stop traversal
			}
			return false;
		})
		return isAProgeny;
	}

	ancestry_ofNextSibling(increment: boolean): Ancestry | null {
		const array = this.siblingAncestries;
		const index = array.map(p => p.id).indexOf(this.id);
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
			for (const childRelationship of childRelationships) {					// loop through all child relationships
				if (childRelationship.idPredicate == idPredicate) {
					let ancestry: Ancestry | null;
					if (isContains) {
						ancestry = this.uniquelyAppendID(childRelationship.id); 	// add each childRelationship's id
					} else {
						ancestry = h.ancestry_remember_createUnique(childRelationship.id, idPredicate);
					}
					if (!!ancestry) {
						ancestries.push(ancestry);									// and push onto the ancestries
					}
				}
			}
			if (isContains) {														// normalize order of children only
				u.ancestries_orders_normalize_remoteMaybe(ancestries);
			}
		}
		return ancestries;
	}

	thingAt(back: number): Thing | null {			// 1 == last
		const relationship = this.relationshipAt(back);
		if (!!relationship && this.id != k.empty) {
			return relationship.child;
		}
		return h.root;	// N.B., h.root is wrong immediately after switching db type
	}

	thing_isImmediateParentOf(ancestry: Ancestry, id: string): boolean {
		const idThing = this.idThing;
		if (idThing != k.unknown) {
			const parents = ancestry.thing?.parents_forID(id);
			return parents?.map(t => t.id).includes(idThing) ?? false;
		}
		return false;
	}

	uniquelyAppendID(id: string): Ancestry | null {
		let ids = this.ids;
		ids.push(id);
		const ancestry = h.ancestry_remember_createUnique(ids.join(k.generic_separator));
		if (!!ancestry) {
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

	isHoverInverted(type: string): boolean {
		const shouldInvert = this.isGrabbed || this.isEditing;
		switch (type) {
			case ElementType.reveal: return this.isExpanded == shouldInvert;
			default: return shouldInvert;
		}
	}

	dotColor(isInverted: boolean): string {
		const thing = this.thing;
		if (!!thing) {
			const showBorder = this.isGrabbed || this.isEditing;
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
			if (!!ancestorAncestry && ancestorAncestry.isVisible) {
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
		return h.ancestry_remember_createUnique(ids.join(k.generic_separator));
	}

	extend_withChild(child: Thing | null): Ancestry | null {
		const idParent = this.thing?.idBridging;
		if (!!child && !!idParent) {
			const relationship = h.relationship_forPredicate_parent_child(Predicate.idContains, idParent, child.id);
			if (!!relationship) {
				return this.uniquelyAppendID(relationship.id);
			}
		}
		return null;
	}

	isAllExpandedFrom(targetAncestry: Ancestry | null): boolean {
		// visit ancestors until encountering
		// either this ancestry (???) or an unexpanded parent
		if (!!targetAncestry && !this.matchesAncestry(targetAncestry)) {
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
		if (!this.isRoot && !!relationships) {
			for (const relationship of relationships) {
				const parent = relationship.parent;
				if (!!parent) {
					children.push(parent);
				}
			}
		}
		return children;
	}

	layout_ancestors_within(thresholdWidth: number): [Array<Thing>, Array<number>, number] {
		let things = this.ancestors.reverse() ?? [];
		const ancestors: Array<Thing> = [];
		let count = 0;
		let totalWidth = 0;
		for (const thing of things) {	// things is root last
			if (!!thing) {
				const crumbWidth = thing.titleWidth;
				if ((totalWidth + crumbWidth) > thresholdWidth) {
					break;
				}
				totalWidth += crumbWidth;
				ancestors.push(thing);
				count = count * 10 + thing.parents.length;
			}
		}
		const left = (thresholdWidth - totalWidth - 20) / 2;
		let sum = left;
		let lefts = [left];
		for (const thing of things.reverse()) {
			sum += thing.titleWidth * 0.98 + 26;
			lefts.push(sum);
		}
		return [ancestors, lefts, count];
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
			if (!visited.includes(this.id) && this.showsChildRelationships) {
				let height = 0;
				for (const childAncestry of this.childAncestries) {
					height += childAncestry.visibleProgeny_height([...visited, this.id]);
				}
				return Math.max(height, k.row_height);
			}
			return k.row_height;
		}
		return 0;
	}

	visibleProgeny_width(special: boolean = show.titleAtTop, visited: Array<number> = []): number {
		const thing = this.thing;
		if (!!thing) {
			const idHashed = this.idHashed;
			let width = special ? 0 : (thing.titleWidth + 6);
			if (!visited.includes(idHashed) && this.showsChildRelationships) {
				let progenyWidth = 0;
				for (const childAncestry of this.childAncestries) {
					const childProgenyWidth = childAncestry.visibleProgeny_width(false, [...visited, idHashed]);
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

	assureIsVisible_inClusters(): boolean {
		return this.parentAncestry?.paging_state?.update_index_toShow(this.siblingIndex) ?? false;
	}

	grabOnly() {
		s_grabbed_ancestries.set([this]);
		this.toggle_editingTools();
	}

	becomeFocus(): boolean {
		const changed = !(get(s_focus_ancestry)?.matchesAncestry(this) ?? false);
		if (changed) {
			s_alteration_mode.set(null);
			s_focus_ancestry.set(this);
			this.expand();
		}
		return changed;
	}

	assureIsVisible_inTree() {
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
		if (this.predicate?.isBidirectional ?? false) {
			this.thing?.oneAncestry?.handle_singleClick_onDragDot(shiftKey);
		} else {
			s_edit_state?.set(null);
			if (!!get(s_alteration_mode)) {
				this.ancestry_alterMaybe(this);
			} else if (!shiftKey && !!get(s_show_rings)) {
				this.becomeFocus();
			} else if (shiftKey || this.isGrabbed) {
				this.toggleGrab();
			} else {
				this.grabOnly();
			}
			signals.signal_rebuildGraph_fromFocus();
		}
	}

	grab() {
		s_grabbed_ancestries.update((array) => {
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
		this.toggle_editingTools();
	}

	ungrab() {
		const rootAncestry = h.rootAncestry;
		s_grabbed_ancestries.update((array) => {
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
		let ancestries = get(s_grabbed_ancestries);
		if (ancestries.length == 0 && !get(s_show_rings)) {
			rootAncestry.grabOnly();
		} else {
			this.toggle_editingTools(); // do not show editingTools for root
		}
	}

	toggle_editingTools() {
		const toolsAncestry = get(s_showing_tools_ancestry);
		if (!!toolsAncestry) { // ignore if editingTools not in use
			s_alteration_mode.set(null);
			if (this.matchesAncestry(toolsAncestry)) {
				s_showing_tools_ancestry.set(null);
			} else if (!this.isRoot) {
				s_showing_tools_ancestry.set(this);
			}
		}
	}

	async ancestry_alterMaybe(ancestry: Ancestry) {
		if (ancestry.canConnect_toToolsAncestry) {
			const alteration = get(s_alteration_mode);
			const toolsAncestry = get(s_showing_tools_ancestry);
			const idPredicate = alteration?.predicate?.id;
			if (!!alteration && !!toolsAncestry && !!idPredicate) {
				h.clear_editingTools();
				switch (alteration.type) {
					case AlterationType.deleting:
						await h.relationship_forget_remoteDelete(toolsAncestry, ancestry, idPredicate);
						break;
					case AlterationType.adding:
						const toolsThing = toolsAncestry.thing;
						if (!!toolsThing) {
							await h.ancestry_remember_remoteAddAsChild(ancestry, toolsThing, idPredicate);
							signals.signal_rebuildGraph_fromFocus();
						}
						break;
				}
			}
		}
	}

	async order_normalizeRecursive_remoteMaybe(remoteWrite: boolean, visited: Array<number> = []) {
		const hid = this.idHashed;
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
			s_expanded_ancestries.update((array) => {
				if (!!array) {
					const index = array.map(a => a.id).indexOf(this.id);
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
		if (!this.isRoot && g.allow_TitleEditing) {
			debug.log_edit(`EDIT ${this.title}`)
			this.grabOnly();
			s_edit_state.set(new Title_State(this));
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
