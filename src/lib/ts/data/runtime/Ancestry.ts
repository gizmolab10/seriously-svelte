import { g, k, u, Rect, Size, Thing, debug, signals, wrappers, Direction, Predicate } from '../../common/Global_Imports';
import { Hierarchy, databases, Relationship, Svelte_Wrapper, Widget_MapRect } from '../../common/Global_Imports';
import { T_Element, T_Predicate, T_Alteration, T_SvelteComponent } from '../../common/Global_Imports';
import { s_radial_geometry, s_alteration_mode, s_title_edit_state } from '../../state/S_Stores';
import { s_hierarchy, s_ancestry_focus, s_ancestry_showing_tools } from '../../state/S_Stores';
import { s_ancestries_grabbed, s_ancestries_expanded, } from '../../state/S_Stores';
import { S_Paging, S_Title_Edit } from '../../common/Global_Imports';
import type { Integer } from '../../common/Types';
import Identifiable from '../basis/Identifiable';
import { get, Writable } from 'svelte/store';
import { T_Database } from '../dbs/DBCommon';

export default class Ancestry extends Identifiable {
	_thing: Thing | null = null;
	kindPredicate: string;
	thing_isChild = true;
	unsubscribe: any;
	type_db: string;

	// id => ancestry string 
	//   "   composed of ids of each relationship
	// NOTE: first relationship's parent is always the root
	//   "   kindPredicate is from the last relationship
	//   "   children are of that kind of predicate

	constructor(type_db: string, ancestryString: string = k.empty, kindPredicate: string = T_Predicate.contains, thing_isChild: boolean = true) {
		super(ancestryString);
		this.thing_isChild = thing_isChild;
		this.kindPredicate = kindPredicate;
		this.type_db = type_db;
		get(s_hierarchy).signal_storage_redraw(0);
	}

	destroy() {
		this.unsubscribe();
		this._thing = null;
	}
	
	static readonly GENERAL: unique symbol;

	signal_rebuildGraph()  { signals.signal_rebuildGraph(this); }
	signal_relayoutWidgets() { signals.signal_relayoutWidgets(this); }

	traverse(apply_closureTo: (ancestry: Ancestry) => boolean) {
		if (!apply_closureTo(this)) {
			for (const childAncestry of this.childAncestries) {
				childAncestry.traverse(apply_closureTo);
			}
		}
	}

	async traverse_async(apply_closureTo: (ancestry: Ancestry) => Promise<boolean>) {
		try {
			if (!await apply_closureTo(this)) {
				for (const childAncestry of this.childAncestries) {
					await childAncestry.traverse_async(apply_closureTo);
				}
			}
		} catch (error) {
			console.error('Error during traverse_async:', error);
		}
	}
	
	static readonly PROPERTIES: unique symbol;
	
	get isRoot():						   boolean { return this.thing?.isRoot ?? false; }
	get hasChildRelationships():		   boolean { return this.childRelationships.length > 0; }
	get hasParentRelationships():		   boolean { return this.parentRelationships.length > 0; }
	get isFocus():						   boolean { return this.matchesStore(s_ancestry_focus); }
	get toolsGrabbed():					   boolean { return this.matchesStore(s_ancestry_showing_tools); }
	get showsChildRelationships():		   boolean { return this.isExpanded && this.hasChildRelationships; }
	get isEditing():					   boolean { return this.ancestry_hasEqualID(get(s_title_edit_state)?.editing); }
	get isStoppingEdit():				   boolean { return this.ancestry_hasEqualID(get(s_title_edit_state)?.stopping); }
	get isGrabbed():					   boolean { return this.includedInStore_ofAncestries(s_ancestries_grabbed); }
	get isInvalid():					   boolean { return this.containsReciprocals || this.containsMixedPredicates; }
	get hasRelationships():				   boolean { return this.hasParentRelationships || this.hasChildRelationships; }
	get isExpanded():					   boolean { return this.isRoot || this.includedInStore_ofAncestries(s_ancestries_expanded); }
	get hasRelevantRelationships():		   boolean { return this.thing_isChild ? this.hasChildRelationships : this.hasParentRelationships; }
	get endID():						    string { return this.idAt(); }
	get title():						    string { return this.thing?.title ?? 'missing title'; }
	get description():					    string { return `${this.kindPredicate} ${this.titles.join(':')}`; }
	get depth():							number { return this.ids.length; }
	get order():						    number { return this.relationship?.order ?? -1; }
	get visibleProgeny_halfHeight():	    number { return this.visibleProgeny_height() / 2; }
	get siblingIndex():					    number { return this.siblingAncestries.map(p => p.id).indexOf(this.id); }
	get visibleProgeny_halfSize():			  Size { return this.visibleProgeny_size.dividedInHalf; }
	get visibleProgeny_size():				  Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height()); }
	get firstChild():						 Thing { return this.children[0]; }
	get lastChild():						 Thing { return this.children.slice(-1)[0]; }
	get hierarchy():					 Hierarchy { return get(s_hierarchy); }
	get titleRect():				   Rect | null { return this.rect_ofWrapper(this.titleWrapper); }
	get idBridging():				 string | null { return this.thing?.idBridging ?? null; }
	get parentAncestry():		   Ancestry | null { return this.stripBack(); }
	get predicate():			  Predicate | null { return this.hierarchy.predicate_forKind(this.kindPredicate) }
	get relationship():		   Relationship | null { return this.relationshipAt(); }
	get widget_map():		 Widget_MapRect | null { return get(s_radial_geometry)?.widget_mapFor(this) ?? null; }
	get titleWrapper():		 Svelte_Wrapper | null { return wrappers.wrapper_forHID_andType(this.hid, T_SvelteComponent.title); }
	get ids_hashed():		   Array	 <Integer> { return this.ids.map(i => i.hash()); }
	get ids():				   Array	  <string> { return this.id.split(k.generic_separator); }
	get titles():			   Array	  <string> { return this.ancestors?.map(t => ` \"${t ? t.title : 'null'}\"`) ?? []; }
	get children():			   Array	   <Thing> { return this.hierarchy.things_forAncestries(this.childAncestries); }
	get ancestors():		   Array	   <Thing> { return this.hierarchy.things_forAncestry(this); }
	get siblingAncestries():   Array	<Ancestry> { return this.parentAncestry?.childAncestries ?? []; }
	get childAncestries():	   Array	<Ancestry> { return this.childAncestries_ofKind(this.kindPredicate); }
	get parentRelationships(): Array<Relationship> { return this.relationships_forParents_ofKind(this.kindPredicate, true); }
	get childRelationships():  Array<Relationship> { return this.relationships_forParents_ofKind(this.kindPredicate, false); }
	
	get relationships(): Array<Relationship> {
		const relationships = this.ids_hashed.map(hid => this.hierarchy.relationship_forHID(hid)) ?? [];
		return u.strip_invalid(relationships);
	}

	get svgDirection_ofReveal(): number {
		const radial_points_right = (this.widget_map?.points_right ?? true) == this.hasChildRelationships;
		const points_right = g.inRadialMode ? radial_points_right : !this.isExpanded;
		return points_right ? Direction.right : Direction.left;
	}
	
	get showsReveal(): boolean {
 		const isVisible = this.hasRelevantRelationships || (this.thing?.isBulkAlias ?? false);
		const isBidirectional = this.predicate?.isBidirectional ?? false;
		return !isBidirectional && isVisible;
	}

	get isEditable(): boolean {
		const isBulkAlias = this.thing?.isBulkAlias ?? true;	// missing thing, return not allow
		const canEdit = !this.isRoot || databases.db.type_db == T_Database.local;
		return canEdit && g.allow_TitleEditing && !isBulkAlias;
	}

	get idThing(): string {
		if (this.isRoot) {
			return this.hierarchy.idRoot ?? k.unknown;
		}
		return this.relationship?.idChild ?? k.unknown;
	}

	get paging_state(): S_Paging | null {
		const predicate = this.predicate;
		const geometry = get(s_radial_geometry);
		if (!!predicate && !!geometry) {
			const map = geometry?.cluster_map_toChildren(this.thing_isChild, predicate)
			return map?.paging_state_ofAncestry(this) ?? null;
		}
		return null;	// either geometry is not setup or predicate is bogus
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
		return thing;
	}

	get isVisible(): boolean {
		if (g.inRadialMode) {
			return this.parentAncestry?.paging_state?.index_isVisible(this.siblingIndex) ?? false;
		} else {
			const focus = get(s_ancestry_focus);
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
			if ((!!idParent || idParent == k.empty) && (!!idChild || idChild == k.empty)) {
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
		let kindPredicate: string | null = null;
		for (const relationship of this.relationships) {
			if (!kindPredicate) {
				kindPredicate = relationship.kindPredicate;
			}
			if (!!kindPredicate &&
				(kindPredicate != this.kindPredicate ||
				![kindPredicate, this.kindPredicate].includes(relationship.kindPredicate))) {
				return true;
			}
		}
		return false;
	}

	get canConnect_toToolsAncestry(): boolean {
		const alteration = get(s_alteration_mode);
		const predicate = alteration?.predicate;
		if (!!alteration && !!predicate) {
			const toolsAncestry = get(s_ancestry_showing_tools);
			const toolThing = toolsAncestry?.thing;
			const thing = this.thing;
			if (!!thing && !!toolThing && !!toolsAncestry) {
				if (thing.hid!= toolThing.hid&& !toolsAncestry.ancestry_hasEqualID(this)) {
					const isRelated = predicate.kind == T_Predicate.isRelated;
					const toolIsAnAncestor = isRelated ? false : thing.parentIDs.includes(toolThing.id);
					const isParentOfTool = this.thing_isImmediateParentOf(toolsAncestry, predicate.kind);
					const isProgenyOfTool = this.isAProgenyOf(toolsAncestry);
					const isDeleting = alteration.type == T_Alteration.deleting;
					const doNotAlter_forIsNotDeleting = isParentOfTool || isProgenyOfTool || toolIsAnAncestor;
					const canAlter = isDeleting ? isParentOfTool : !doNotAlter_forIsNotDeleting;
					return canAlter
				}
			}
		}
		return false;
	}

	rect_ofWrapper(wrapper: Svelte_Wrapper | null): Rect | null { return wrapper?.boundingRect ?? null; }
	matchesStore(store: Writable<Ancestry | null>): boolean { return get(store)?.ancestry_hasEqualID(this) ?? false; }
	includesPredicateKind(kindPredicate: string): boolean { return this.thing?.hasParents_forKind(kindPredicate) ?? false; }
	includedInStore_ofAncestries(store: Writable<Array<Ancestry>>): boolean { return this.includedInAncestries(get(store)); }
	sharesAnID(ancestry: Ancestry | null): boolean { return !ancestry ? false : this.ids.some(id => ancestry.ids.includes(id)); }
	showsClusterFor(predicate: Predicate): boolean { return this.includesPredicateKind(predicate.kind) && this.hasThings(predicate); }
	relationshipAt(back: number = 1): Relationship | null { return this.hierarchy.relationship_forHID(this.idAt(back).hash()) ?? null; }
	ancestry_hasEqualID(ancestry: Ancestry | null | undefined): boolean { return !!ancestry && this.hid == ancestry.hid&& this.type_db == ancestry.type_db; }
	
	relationships_forParents_ofKind(kindPredicate: string, forParents: boolean) {
		return this.thing?.relationships_forParents_ofKind(kindPredicate, forParents) ?? [];
	}

	thingAt(back: number): Thing | null {			// 1 == last
		const relationship = this.relationshipAt(back);
		if (!!relationship && this.id != k.empty) {
			return relationship.child;
		}
		return this.hierarchy.root;	// N.B., this.hierarchy.root is wrong immediately after switching db type
	}

	thing_isImmediateParentOf(ancestry: Ancestry, kind: string): boolean {
		const idThing = this.idThing;
		if (idThing != k.unknown) {
			const parents = ancestry.thing?.parents_forKind(kind);
			return parents?.map(t => t.id).includes(idThing) ?? false;
		}
		return false;
	}

	includedInAncestries(ancestries: Array<Ancestry>): boolean {
		const included = ancestries.filter(a => {
			return this.ancestry_hasEqualID(a);
		});
		return included.length > 0;
	}

	hasThings(predicate: Predicate): boolean {
		switch (predicate.kind) {
			case T_Predicate.contains:  return this.thing?.hasParents_forKind(predicate.kind) ?? false;
			case T_Predicate.isRelated: return this.hasRelationships;
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
			case T_Element.reveal: return this.isExpanded == shouldInvert;
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
			return this.hierarchy.rootAncestry;
		}
		return this.hierarchy.ancestry_remember_createUnique(ids.join(k.generic_separator));
	}

	extend_withChild(child: Thing | null): Ancestry | null {
		const idParent = this.thing?.idBridging;
		if (!!child && !!idParent) {
			const relationship = this.hierarchy.relationship_forPredicateKind_parent_child(T_Predicate.contains, idParent, child.id);
			if (!!relationship) {
				return this.uniquelyAppendID(relationship.id);
			}
		}
		return null;
	}

	isAllExpandedFrom(targetAncestry: Ancestry | null): boolean {
		// visit ancestors until encountering
		// either this ancestry (???) or an unexpanded parent
		if (!!targetAncestry && !this.ancestry_hasEqualID(targetAncestry)) {
			const ancestry = this.parentAncestry;			// visit parent of ancestry
			if (!ancestry || (!ancestry.isExpanded && !ancestry.isAllExpandedFrom(targetAncestry))) {
				return false;	// stop when no ancestor or ancestor is not expanded
			}
		}
		return true;
	}

	things_childrenFor(kindPredicate: string): Array<Thing> {
		const relationships = this.thing?.relationships_forParents_ofKind(kindPredicate, true);
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

	isAProgenyOf(ancestry: Ancestry): boolean {
		let isAProgeny = false;
		if (!(ancestry.predicate?.isBidirectional ?? true)) {
			ancestry.traverse((progenyAncestry: Ancestry) => {
				if (progenyAncestry.hid == this.hid) {
					isAProgeny = true;
					return true;	// stop traversal
				}
				return false;
			})
		}
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

	uniquelyAppendID(id: string): Ancestry | null {
		let ids = this.ids;
		ids.push(id);
		const ancestry = this.hierarchy.ancestry_remember_createUnique(ids.join(k.generic_separator));
		if (!!ancestry) {
			if (ancestry.containsMixedPredicates) {
				this.hierarchy.ancestry_forget(ancestry);
				return null;
			}
			if (ancestry.containsReciprocals) {
				this.hierarchy.ancestry_forget(ancestry);
				return null;
			}
		}
		return ancestry;
	}

	childAncestries_ofKind(kindPredicate: string): Array<Ancestry> {
		let ancestries: Array<Ancestry> = [];
		const isContains = kindPredicate == T_Predicate.contains;
		const childRelationships = this.relationships_forParents_ofKind(kindPredicate, false);
		if (childRelationships.length > 0) {
			for (const childRelationship of childRelationships) {					// loop through all child relationships
				if (childRelationship.kindPredicate == kindPredicate) {
					let ancestry: Ancestry | null;
					if (isContains) {
						ancestry = this.uniquelyAppendID(childRelationship.id); 	// add each childRelationship's id
					} else {
						ancestry = this.hierarchy.ancestry_remember_createUnique(childRelationship.id, kindPredicate);
					}
					if (!!ancestry) {
						ancestries.push(ancestry);									// and push onto the ancestries
					}
				}
			}
			if (isContains) {
				u.ancestries_orders_normalize_persistentMaybe(ancestries);			// normalize order of children only
			}
		}
		return ancestries;
	}

	layout_breadcrumbs_within(thresholdWidth: number): [Array<Thing>, Array<number>, Array<number>, number] {
		const crumb_things: Array<Thing> = [];
		const widths: Array<number> = [];
		let parent_widths = 0;						// encoded as one parent count per 2 digits (base 10) ... for triggering redraw
		let total = 0;								// determine how many crumbs will fit
		const things = this.ancestors ?? [];
		for (const thing of things) {
			if (!!thing) {
				const width = u.getWidthOf(thing.breadcrumb_title) + 29;
				if ((total + width) > thresholdWidth) {
					break;
				}
				total += width;
				widths.push(width);
				crumb_things.push(thing);
				debug.log_crumbs(`${width} ${thing.title}`);
				parent_widths = parent_widths * 100 + width;
			}
		}
		let left = (thresholdWidth - total) / 2;	// position of first crumb
		let lefts = [left];
		for (const width of widths) {
			left += width;							// position of next crumb
			lefts.push(left);
		}
		return [crumb_things, widths, lefts, parent_widths];
	}

	visibleProgeny_width(special: boolean = false, visited: Array<number> = []): number {
		const thing = this.thing;
		if (!!thing) {
			const hid = this.hid;
			let width = special ? 0 : (thing.titleWidth + 6);
			if (!visited.includes(hid) && this.showsChildRelationships) {
				let progenyWidth = 0;
				for (const childAncestry of this.childAncestries) {
					const childProgenyWidth = childAncestry.visibleProgeny_width(false, [...visited, hid]);
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

	static readonly MUTATION: unique symbol;
	
	expand() { return this.expanded_setTo(true); }
	collapse() { return this.expanded_setTo(false); }
	toggleGrab() { if (this.isGrabbed) { this.ungrab(); } else { this.grab(); } }
	toggleExpanded() { return this.isExpanded ? this.collapse() : this.expand(); }

	assureIsVisible_inClusters(): boolean {
		return this.parentAncestry?.paging_state?.update_index_toShow(this.siblingIndex) ?? false;
	}

	grabOnly() {
		s_ancestries_grabbed.set([this]);
		this.toggle_editingTools();
	}

	becomeFocus(force: boolean = false): boolean {
		const priorFocus = get(s_ancestry_focus)
		const changed = force || !priorFocus || !this.ancestry_hasEqualID(priorFocus!);
		if (changed) {
			s_alteration_mode.set(null);
			s_ancestry_focus.set(this);
		}
		this.expand();
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
		this.hierarchy.rootAncestry.expand();
		this.hierarchy.rootAncestry.becomeFocus();
	}

	handle_singleClick_onDragDot(shiftKey: boolean) {
		if (this.predicate?.isBidirectional ?? false) {
			this.thing?.oneAncestry?.handle_singleClick_onDragDot(shiftKey);
		} else {
			s_title_edit_state?.set(null);
			if (!!get(s_alteration_mode)) {
				this.ancestry_alterMaybe(this);
			} else if (!shiftKey && g.inRadialMode) {
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
		s_ancestries_grabbed.update((a) => {
			let array = a ?? [];
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
		const rootAncestry = this.hierarchy.rootAncestry;
		s_ancestries_grabbed.update((a) => {
			let array = a ?? [];
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
		if (ancestries.length == 0 && !g.inRadialMode) {
			rootAncestry.grabOnly();
		} else {
			this.toggle_editingTools(); // do not show editingTools for root
		}
	}

	toggle_editingTools() {
		const toolsAncestry = get(s_ancestry_showing_tools);
		if (!!toolsAncestry) { // ignore if editingTools not in use
			s_alteration_mode.set(null);
			if (this.ancestry_hasEqualID(toolsAncestry)) {
				s_ancestry_showing_tools.set(null);
			} else if (!this.isRoot) {
				s_ancestry_showing_tools.set(this);
			}
		}
	}

	async ancestry_alterMaybe(ancestry: Ancestry) {
		if (ancestry.canConnect_toToolsAncestry) {
			const alteration = get(s_alteration_mode);
			const toolsAncestry = get(s_ancestry_showing_tools);
			const kindPredicate = alteration?.predicate?.kind;
			if (!!alteration && !!toolsAncestry && !!kindPredicate) {
				this.hierarchy.clear_editingTools();
				switch (alteration.type) {
					case T_Alteration.deleting:
						await this.hierarchy.relationship_forget_persistentDelete(toolsAncestry, ancestry, kindPredicate);
						break;
					case T_Alteration.adding:
						const toolsThing = toolsAncestry.thing;
						if (!!toolsThing) {
							await this.hierarchy.relationship_remember_persistent_addChild_toAncestry(toolsThing, ancestry, kindPredicate);
							signals.signal_rebuildGraph_fromFocus();
						}
						break;
				}
			}
		}
	}

	order_normalizeRecursive_persistentMaybe(persist: boolean, visited: Array<number> = []) {
		const hid = this.hid;
		const childAncestries = this.childAncestries;
		if (!visited.includes(hid) && childAncestries && childAncestries.length > 1) {
			u.ancestries_orders_normalize_persistentMaybe(childAncestries, persist);
			for (const childAncestry of childAncestries) {
				childAncestry.order_normalizeRecursive_persistentMaybe(persist, [...visited, hid]);
			}
		}
	}
	
	expanded_setTo(expand: boolean) {
		let mutated = false;
		if (!this.isRoot || expand) {
			s_ancestries_expanded.update((a) => {
				let array = a ?? [];
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
		if (this.isEditable) {
			debug.log_edit(`EDIT ${this.title}`)
			this.grabOnly();
			s_title_edit_state.set(new S_Title_Edit(this));
		}
	}

}
