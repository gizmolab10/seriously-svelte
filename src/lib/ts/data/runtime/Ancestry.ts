import { Direction, Predicate, Hierarchy, databases, Relationship, Svelte_Wrapper } from '../../common/Global_Imports';
import { c, k, u, ux, show, Rect, Size, Thing, debug, signals, wrappers, svgPaths } from '../../common/Global_Imports';
import { T_Element, T_Predicate, T_Alteration, T_SvelteComponent } from '../../common/Global_Imports';
import { G_Widget, S_Paging, S_Title_Edit, G_TreeChildren } from '../../common/Global_Imports';
import { w_hierarchy, w_ancestry_focus, w_ancestry_showing_tools } from '../../common/Stores';
import { w_ancestries_grabbed, w_ancestries_expanded, } from '../../common/Stores';
import { w_s_alteration, w_s_title_edit } from '../../common/Stores';
import { w_background_color } from '../../common/Stores';
import type { Integer } from '../../common/Types';
import { T_Edit } from '../../state/S_Title_Edit';
import { get, Writable } from 'svelte/store';
import { T_Database } from '../dbs/DBCommon';
import Identifiable from './Identifiable';

export default class Ancestry extends Identifiable {
	reciprocals: Array<Ancestry> = [];
	kindPredicate: string;
	thing_isChild = true;
	g_widget!: G_Widget;
	t_database: string;

	// id => ancestry (path) string 
	//   "   composed of ids of each relationship
	// NOTE: first relationship's parent is always the root
	//   "   kindPredicate is from the last relationship
	//  	 all children are of that kind of predicate
	//	 "	 reciprocals are all the ancestries that point to the isRelatedTo thing
	//		 (there can be many if thing or its ancestors hav multiple parents)

	constructor(t_database: string, path: string = k.root_path, kindPredicate: string = T_Predicate.contains, thing_isChild: boolean = true) {
		super(path);
		this.t_database = t_database;
		this.thing_isChild = thing_isChild;
		this.kindPredicate = kindPredicate;
		this.g_widget = G_Widget.empty(this);
		this.update_reciprocals();
		this.hierarchy.signal_storage_redraw(0);
	}
	
	static readonly GENERAL: unique symbol;

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
	
	get isRoot():							 boolean { return this.pathString == k.root_path; }
	get hasChildRelationships():			 boolean { return this.childRelationships.length > 0; }
	get hasParentRelationships():			 boolean { return this.parentRelationships.length > 0; }
	get isFocus():							 boolean { return this.matchesStore(w_ancestry_focus); }
	get hasRelevantRelationships():			 boolean { return this.relevantRelationships_count > 0; }
	get showsReveal():						 boolean { return this.showsReveal_forPointingToChild(true); }
	get toolsGrabbed():						 boolean { return this.matchesStore(w_ancestry_showing_tools); }
	get showsChildRelationships():			 boolean { return this.isExpanded && this.hasChildRelationships; }
	get isGrabbed():						 boolean { return this.includedInStore_ofAncestries(w_ancestries_grabbed); }
	get isInvalid():						 boolean { return this.containsReciprocals || this.containsMixedPredicates; }
	get hasRelationships():					 boolean { return this.hasParentRelationships || this.hasChildRelationships; }
	get isEditing():						 boolean { return get(w_s_title_edit)?.isAncestry_inState(this, T_Edit.editing) ?? false; }
	get isExpanded():						 boolean { return this.isRoot || this.includedInStore_ofAncestries(w_ancestries_expanded); }
	get pathString():						  string { return this.id; }
	get title():						   	  string { return this.thing?.title ?? 'missing title'; }
	get description():					   	  string { return `${this.kindPredicate} "${this.thing?.type ?? '-'}" ${this.titles.join(':')}`; }
	get depth():							  number { return this.relationship_ids.length; }
	get order():						   	  number { return this.relationship?.order ?? -1; }
	get visibleProgeny_halfHeight():	   	  number { return this.visibleProgeny_height() / 2; }
	get relevantRelationships_count():		  number { return this.relevantRelationships.length; }
	get direction_ofReveal():				  number { return this.points_right ? Direction.right : Direction.left; }
	get siblingIndex():					   	  number { return this.siblingAncestries.map(p => p.id).indexOf(this.id); }
	get visibleProgeny_size():					Size { return new Size(this.visibleProgeny_width(), this.visibleProgeny_height()); }
	get visibleProgeny_halfSize():				Size { return this.visibleProgeny_size.dividedInHalf; }
	get lastChild():						   Thing { return this.children.slice(-1)[0]; }
	get firstChild():						   Thing { return this.children[0]; }
	get hierarchy():					   Hierarchy { return get(w_hierarchy); }
	get titleRect():					 Rect | null { return this.rect_ofWrapper(this.titleWrapper); }
	get thing():						Thing | null { return this.hierarchy.thing_forAncestry(this); }
	get idBridging():				   string | null { return this.thing?.idBridging ?? null; }
	get parentAncestry():			 Ancestry | null { return this.stripBack(); }
	get predicate():				Predicate | null { return this.hierarchy.predicate_forKind(this.kindPredicate) }
	get relationship():			 Relationship | null { return this.relationshipAt(); }
	get titleWrapper():		   Svelte_Wrapper | null { return wrappers.wrapper_forHID_andType(this.hid, T_SvelteComponent.title); }
	get relationship_hids():	 Array	   <Integer> { return this.relationship_ids.map(i => i.hash()); }
	get relationship_ids():	 	 Array		<string> { return this.isRoot ? [] : this.id.split(k.generic_separator); }
	get titles():			 	 Array		<string> { return this.ancestors?.map(a => ` "${a ? a.title : 'null'}"`) ?? []; }
	get children():			 	 Array		 <Thing> { return this.hierarchy.things_forAncestries(this.childAncestries); }
	get ancestors():		 	 Array		 <Thing> { return this.hierarchy.things_forAncestry(this); }
	get siblingAncestries(): 	 Array	  <Ancestry> { return this.parentAncestry?.childAncestries ?? []; }
	get childAncestries():	 	 Array	  <Ancestry> { return this.childAncestries_ofKind(this.kindPredicate); }
	get relevantRelationships(): Array<Relationship> { return this.relationships_forChildren(this.thing_isChild); }
	get parentRelationships():	 Array<Relationship> { return this.relationships_ofKind_forParents(this.kindPredicate, true); }
	get childRelationships():	 Array<Relationship> { return this.relationships_ofKind_forParents(this.kindPredicate, false); }

	get relationships(): Array<Relationship> {
		const relationships = this.relationship_hids.map(hid => this.hierarchy.relationship_forHID(hid)) ?? [];
		return u.strip_invalid(relationships);
	}

	get points_right(): boolean {
		const radial_points_right = this.g_widget?.points_right ?? true;
		const hasVisibleChildren = this.isExpanded && this.hasChildRelationships;
		return ux.inRadialMode ? radial_points_right : !hasVisibleChildren;
	}

	get isEditable(): boolean {
		const isExternals = this.thing?.isExternals ?? true;
		const isBulkAlias = this.thing?.isBulkAlias ?? true;	// missing thing, return not editable
		const canEdit = !this.isRoot || databases.db_now.t_database == T_Database.local;
		return canEdit && c.allow_TitleEditing && !isExternals && !isBulkAlias;
	}

	get id_thing(): string {
		if (this.isRoot) {
			return this.hierarchy.idRoot ?? k.unknown;
		}
		return this.relationship?.idChild ?? k.unknown;
	}

	get svgPathFor_revealDot(): string {
		if (this.showsReveal) {
			return svgPaths.fat_polygon(k.dot_size, this.direction_ofReveal);
		}
		return svgPaths.circle_atOffset(k.dot_size, k.dot_size - 1);
	}

	get s_paging(): S_Paging | null {
		const predicate = this.predicate;
		const g_radialGraph = ux.g_radialGraph;
		if (!!predicate && !!g_radialGraph) {
			const g_cluster = g_radialGraph?.g_cluster_pointing_toChildren(this.thing_isChild, predicate)
			return g_cluster?.s_ancestryPaging(this) ?? null;
		}
		return null;	// either g_radialGraph is not setup or predicate is bogus
	}

	get firstVisibleChildAncestry(): Ancestry {
		const childAncestries = this.childAncestries;
		const first = childAncestries[0]
		if (ux.inRadialMode) {
			const s_paging = this.s_paging
			const maybe = s_paging?.ancestry_atIndex(childAncestries);
			if (!!maybe) {
				return maybe;
			}
		}
		return first;
	}

	get isVisible(): boolean {
		if (ux.inTreeMode) {
			const focus = get(w_ancestry_focus);
			const incorporates = this.incorporates(focus);
			const expanded = this.isAllExpandedFrom(focus);
			return (incorporates && expanded);
		} else if (this.isBidirectional) {
			return true;			// TODO: trouble?
		} else {
			return this.parentAncestry?.s_paging?.index_isVisible(this.siblingIndex) ?? false;
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

	get isBidirectional(): boolean { return this.predicate?.isBidirectional ?? false; }
	get isUnidirectional(): boolean { return this.predicate?.isBidirectional ?? true; }

	get containsReciprocals(): boolean {
		let idChild: string | null =  null;
		let idParent: string | null =  null;
		for (const relationship of this.relationships) {
			if ((!!idParent || idParent == k.empty) 
				&& (!!idChild || idChild == k.empty) 
				&& idParent == relationship.idChild 
				&& idChild == relationship.idParent) {
				return true;
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
		const alteration = get(w_s_alteration);
		const predicate = alteration?.predicate;
		if (!!alteration && !!predicate) {
			const toolsAncestry = get(w_ancestry_showing_tools);
			const toolThing = toolsAncestry?.thing;
			const thing = this.thing;
			if (!!thing && !!toolThing && !!toolsAncestry) {
				if (thing.hid != toolThing.hid && !toolsAncestry.hasPathString_matching(this)) {
					const isBidirectional = predicate.isBidirectional;
					const toolIsAnAncestor = isBidirectional ? false : thing.parentIDs.includes(toolThing.id);
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
	
	relationships_count_forChildren(forChildren: boolean):			 number { return this.relationships_forChildren(forChildren).length; }
	includedInStore_ofAncestries(store: Writable<Array<Ancestry>>): boolean { return this.includedInAncestries(get(store)); }
	matchesStore(store: Writable<Ancestry | null>):					boolean { return get(store)?.hasPathString_matching(this) ?? false; }
	includesPredicate_ofKind(kindPredicate: string):				boolean { return this.thing?.hasParents_forKind(kindPredicate) ?? false; }
	sharesAnID(ancestry: Ancestry | null):							boolean { return !ancestry ? false : this.relationship_ids.some(id => ancestry.relationship_ids.includes(id)); }
	showsCluster_forPredicate(predicate: Predicate):				boolean { return this.includesPredicate_ofKind(predicate.kind) && this.hasThings(predicate); }
	hasPathString_matching(ancestry: Ancestry | null | undefined):	boolean { return !!ancestry && this.hid == ancestry.hid && this.t_database == ancestry.t_database; }
	relationships_forChildren(forChildren: boolean):	Array<Relationship> { return forChildren ? this.childRelationships : this.parentRelationships; }
	relationshipAt(back: number = 1):					Relationship | null { return this.hierarchy.relationship_forHID(this.idAt(back).hash()) ?? null; }
	rect_ofWrapper(wrapper: Svelte_Wrapper | null):				Rect | null { return wrapper?.boundingRect ?? null; }

	relationships_ofKind_forParents(kindPredicate: string, forParents: boolean): Array<Relationship> {
		return this.thing?.relationships_ofKind_forParents(kindPredicate, forParents) ?? [];
	}

	showsReveal_forPointingToChild(points_toChild: boolean): boolean {
		return ((this.relationships_count_forChildren(points_toChild) > 0) || (this.thing?.isBulkAlias ?? false)) && !(this.predicate?.isBidirectional ?? true);
	}

	thingAt(back: number): Thing | null {			// 1 == last
		const relationship = this.relationshipAt(back);
		if (!!relationship && this.id != k.root_path) {
			return relationship.child;
		}
		return this.hierarchy.root;	// N.B., this.hierarchy.root is wrong immediately after switching db type
	}

	thing_isImmediateParentOf(ancestry: Ancestry, kind: string): boolean {
		const id_thing = this.id_thing;
		if (id_thing != k.unknown) {
			const parents = ancestry.thing?.parents_forKind(kind);
			return parents?.map(t => t.id).includes(id_thing) ?? false;
		}
		return false;
	}

	includedInAncestries(ancestries: Array<Ancestry> | undefined): boolean {
		const included = ancestries?.filter(a => {
			return this.hasPathString_matching(a);
		});
		return (included?.length ?? 0) > 0;
	}

	hasThings(predicate: Predicate): boolean {
		switch (predicate.kind) {
			case T_Predicate.contains:  return this.thing?.hasParents_forKind(predicate.kind) ?? false;
			case T_Predicate.isRelated: return this.hasRelationships;
			default:					return false;
		}
	}

	idAt(back: number = 1): string {	// default 1 == last
		const ids = this.relationship_ids;
		if (back > ids.length) {
			return k.root_path;
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
		return get(w_background_color);
	}

	progeny_count(visited: Array<number> = []): number {
		let sum = 0;
		const hid = this.thing?.hid;
		if (!!hid && !visited.includes(hid)) {
			const children = this.childAncestries;
			for (const child of children) {
				sum += child.progeny_count([...visited, hid]) + 1;
			}
		}
		return sum;
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
		const stripped_ids = this.relationship_ids.slice(0, -back);
		if (stripped_ids.length == 0) {
			return this.hierarchy.rootAncestry;
		} else {
			return this.hierarchy.ancestry_remember_createUnique(stripped_ids.join(k.generic_separator));
		}
	}

	extend_withChild(child: Thing | null): Ancestry | null {
		const hidParent = this.thing?.idBridging.hash();
		if (!!child && !!hidParent) {
			const relationship = this.hierarchy.relationship_forPredicateKind_parent_child(T_Predicate.contains, hidParent, child.hid);
			if (!!relationship) {
				return this.uniquelyAppend_relationshipID(relationship.id);
			}
		}
		return null;
	}

	isAllExpandedFrom(targetAncestry: Ancestry | null): boolean {
		// visit ancestors until encountering
		// either this ancestry (???) or an unexpanded parent
		if (!!targetAncestry && !this.hasPathString_matching(targetAncestry)) {
			const ancestry = this.parentAncestry;			// visit parent of ancestry
			if (!ancestry || (!ancestry.isExpanded && !ancestry.isAllExpandedFrom(targetAncestry))) {
				return false;	// stop when no ancestor or ancestor is not expanded
			}
		}
		return true;
	}

	svgPathFor_tinyDots_outsideReveal(points_toChild: boolean): string | null {
		const in_radial_mode = ux.inRadialMode;
		const isVisible_forChild = this.hasChildRelationships && show.children_dots && (in_radial_mode ? true : !this.isExpanded);
		const isVisible_inRadial = points_toChild ? isVisible_forChild : this.hasParentRelationships && (this.isUnidirectional ? show.parent_dots : show.related_dots);
		const show_outside_tinyDots = in_radial_mode ? isVisible_inRadial : isVisible_forChild;
		const outside_tinyDots_count = this.relationships_count_forChildren(points_toChild);
		return !show_outside_tinyDots ? null : svgPaths.tinyDots_circular(k.diameterOf_outer_tinyDots + 4, outside_tinyDots_count as Integer, this.points_right);
	}

	things_childrenFor(kindPredicate: string): Array<Thing> {
		const relationships = this.thing?.relationships_ofKind_forParents(kindPredicate, true);
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
		if (!ancestry.isUnidirectional) {
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
			const ids = this.relationship_ids;
			const ancestryIDs = ancestry.relationship_ids;
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

	uniquelyAppend_relationshipID(id: string): Ancestry | null {
		if (this.isRoot) {
			return this.hierarchy.ancestry_remember_createUnique(id);
		} else {
			let ids = this.relationship_ids;
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
	}

	childAncestries_ofKind(kindPredicate: string): Array<Ancestry> {
		let ancestries: Array<Ancestry> = [];
		const childRelationships = this.childRelationships;
		const isContains = kindPredicate == T_Predicate.contains;
		if (childRelationships.length > 0) {
			for (const childRelationship of childRelationships) {					// loop through all child relationships
				if (childRelationship.kindPredicate == kindPredicate) {
					let ancestry: Ancestry | null;
					if (isContains) {
						ancestry = this.uniquelyAppend_relationshipID(childRelationship.id); 	// add each childRelationship's id
					} else {
						ancestry = this.hierarchy.ancestry_remember_createUnique(childRelationship.id, kindPredicate);
					}
					if (!!ancestry) {
						ancestries.push(ancestry);									// and push onto the ancestries
					}
				}
			}
			if (isContains) {
				u.ancestries_orders_normalize(ancestries);							// normalize order of children only
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
				debug.log_crumbs(`ONE ${width} ${thing.title}`);
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

	update_reciprocals() {
		// determine visibility elsewhere (cache where?, stale?)
		const reciprocals: Array<Ancestry> = [];
		if (this.isBidirectional) {
			const id_thing = this.relationship?.idChild;
			const matches = this.hierarchy.ancestries.map(v => {return (v.id_thing == id_thing) ? v : null});
			for (const match of matches) {
				if (!!match && !match.isBidirectional) {
					reciprocals.push(match);
					// console.log(`reciprocal ${match.titles}`)
				}
			}
			this.reciprocals = reciprocals;
		}
	}

	static readonly FOCUS: unique symbol;

	becomeFocus(force: boolean = false): boolean {
		const priorFocus = get(w_ancestry_focus)
		const changed = force || !priorFocus || !this.hasPathString_matching(priorFocus!);
		if (changed) {
			w_s_alteration.set(null);
			w_ancestry_focus.set(this);
		}
		this.expand();
		return changed;
	}

	static readonly EVENTS: unique symbol;

	handle_singleClick_onDragDot(shiftKey: boolean) {
		if (this.isBidirectional && this.reciprocals.length > 0) {
			console.log('hah')
			this.reciprocals[0].handle_singleClick_onDragDot(shiftKey);
		} else {
			w_s_title_edit?.set(null);
			if (!!get(w_s_alteration)) {
				this.ancestry_alterMaybe(this);
			} else if (!shiftKey && ux.inRadialMode) {
				this.becomeFocus();
				signals.signal_rebuildGraph_fromFocus();
				return;
			} else if (shiftKey || this.isGrabbed) {
				this.toggleGrab();
			} else {
				this.grabOnly();
			}
			signals.signal_reposition_widgets_fromFocus();
		}
	}

	static readonly VISIBILITY: unique symbol;

	assureIsVisible_inClusters(): boolean {
		return this.parentAncestry?.s_paging?.update_index_toShow(this.siblingIndex) ?? false;
	}

	assureisVisible_forChild() {
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

	visibleProgeny_ancestries(visited: Array<string> = []): Array<Ancestry> {
		let ancestries: Array<Ancestry> = [];
		if (this.isVisible) {
			ancestries.push(this);
		}
		const thing = this.thing;
		if (!!thing) {
			if (!visited.includes(this.id) && this.showsChildRelationships) {
				for (const childAncestry of this.childAncestries) {
					const progeny = childAncestry.visibleProgeny_ancestries([...visited, this.id]);
					ancestries = [...ancestries, ...progeny];
				}
			}
		}
		return ancestries;
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

	static readonly EDIT: unique symbol;

	startEdit() {
		if (this.isEditable && !get(w_s_title_edit)) {
			w_s_title_edit.set(new S_Title_Edit(this));
			debug.log_edit(`SETUP ${this.title}`);
			this.grabOnly();
		}
	}

	toggle_editingTools() {
		const toolsAncestry = get(w_ancestry_showing_tools);
		if (!!toolsAncestry) { // ignore if editingTools not in use
			w_s_alteration.set(null);
			if (this.hasPathString_matching(toolsAncestry)) {
				w_ancestry_showing_tools.set(null);
			} else if (!this.isRoot) {
				w_ancestry_showing_tools.set(this);
			}
		}
	}

	async ancestry_alterMaybe(ancestry: Ancestry) {
		if (ancestry.canConnect_toToolsAncestry) {
			const alteration = get(w_s_alteration);
			const toolsAncestry = get(w_ancestry_showing_tools);
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
							await this.hierarchy.ancestry_extended_byAddingThing_toAncestry_remember_persistentCreate_relationship(toolsThing, ancestry, kindPredicate);
							signals.signal_rebuildGraph_fromFocus();
						}
						break;
				}
			}
		}
	}

	order_normalizeRecursive(persist: boolean, visited: Array<number> = []) {
		const hid = this.hid;
		const childAncestries = this.childAncestries;
		if (!visited.includes(hid) && childAncestries && childAncestries.length > 1) {
			u.ancestries_orders_normalize(childAncestries, persist);
			for (const childAncestry of childAncestries) {
				childAncestry.order_normalizeRecursive(persist, [...visited, hid]);
			}
		}
	}

	static readonly EXPAND: unique symbol;
	
	expand() { return this.expanded_setTo(true); }
	collapse() { return this.expanded_setTo(false); }
	toggleExpanded() { return this.expanded_setTo(!this.isExpanded); }

	remove_fromGrabbed_andExpanded() {
		this.collapse();
		this.ungrab();
	}
	
	expanded_setTo(expand: boolean) {
		let mutated = false;
		if (!this.isRoot || expand) {
			this.g_widget.g_treeChildren = expand ? new G_TreeChildren(this) : null;	// for layout
			w_ancestries_expanded.update((a) => {
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

	static readonly GRAB: unique symbol;
	
	toggleGrab() { if (this.isGrabbed) { this.ungrab(); } else { this.grab(); } }

	grabOnly() {
		debug.log_grab(`  GRAB ONLY "${this.title}"`);
		w_ancestries_grabbed.set([this]);
		this.toggle_editingTools();
	}

	grab_forShift(SHIFT: boolean) {
		if (SHIFT) {
			this.grab();
		} else {
			this.grabOnly();
		}
	}

	grab() {
		w_ancestries_grabbed.update((a) => {
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
		debug.log_grab(`  GRAB "${this.title}"`);
		this.toggle_editingTools();
	}

	ungrab() {
		w_s_title_edit.set(null);
		const rootAncestry = this.hierarchy.rootAncestry;
		w_ancestries_grabbed.update((a) => {
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
		let ancestries = get(w_ancestries_grabbed) ?? [];
		if (ancestries.length == 0 && ux.inTreeMode) {
			rootAncestry.grabOnly();
		} else {
			this.toggle_editingTools(); // do not show editingTools for root
		}
		debug.log_grab(`  UNGRAB "${this.title}"`);
	}

	persistentMoveUp_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean): [boolean, boolean] {
		if (this.isBidirectional) {
			return this.persistentMoveUp_forBidirectional_maybe(up, SHIFT, OPTION, EXTREME);
		}
		const parentAncestry = this.parentAncestry;
		let graph_needsRelayout = false;
		let graph_needsRebuild = false;
		if (!!parentAncestry) {
			const siblings = parentAncestry.children ?? [];
			const length = siblings.length;
			const thing = this?.thing;
			if (length == 0) {		// friendly for first-time users
				this.hierarchy.ancestry_rebuild_runtimeBrowseRight(this, up, SHIFT, EXTREME, true);
			} else if (!!thing) {
				const is_radial_mode = ux.inRadialMode;
				if ((this.thing_isChild) || !is_radial_mode) {
					const index = siblings.indexOf(thing);
					const newIndex = index.increment(!up, length);
					if (!!parentAncestry && !OPTION) {
						const grabAncestry = parentAncestry.extend_withChild(siblings[newIndex]);
						if (!!grabAncestry) {
							if (!grabAncestry.isVisible) {
								if (!parentAncestry.isFocus) {
									graph_needsRebuild = parentAncestry.becomeFocus();
								} else if (is_radial_mode) {
									graph_needsRebuild = grabAncestry.assureIsVisible_inClusters();	// change paging
								} else {
									alert('PROGRAMMING ERROR: child of focus is not visible');
								}
							}
							grabAncestry.grab_forShift(SHIFT);
							graph_needsRelayout = true;
						}
					} else if (c.allow_GraphEditing && OPTION) {
						graph_needsRebuild = true;
						u.ancestries_orders_normalize(parentAncestry.childAncestries, false);
						const wrapped = up ? (index == 0) : (index + 1 == length);
						const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
						const newOrder = newIndex + goose;
						this.relationship?.order_setTo(newOrder);
						u.ancestries_orders_normalize(parentAncestry.childAncestries);
					}
				}
			}
		}
		return [graph_needsRebuild, graph_needsRelayout];
	}

	persistentMoveUp_forBidirectional_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean): [boolean, boolean] {
		const focusAncestry = get(w_ancestry_focus);
		const siblingAncestries = focusAncestry?.thing?.parentAncestries;
		let graph_needsRelayout = false;
		let graph_needsRebuild = false;
		if (!!focusAncestry && siblingAncestries) {
			const siblings = siblingAncestries?.map(a => a.thing).filter(t => !!t) ?? [];
			const length = siblings.length;
			const thing = this?.thing;
			if (length == 0) {		// friendly for first-time users
				this.hierarchy.ancestry_rebuild_runtimeBrowseRight(this, up, SHIFT, EXTREME, true);
			} else if (!!thing) {
				const is_radial_mode = true;
				const index = siblings.indexOf(thing);
				const newIndex = index.increment(!up, length);
				if (!!focusAncestry && !OPTION) {
					const grabAncestry = focusAncestry.extend_withChild(siblings[newIndex]);
					if (!!grabAncestry) {
						if (!grabAncestry.isVisible) {
							if (!focusAncestry.isFocus) {
								graph_needsRebuild = focusAncestry.becomeFocus();
							} else if (is_radial_mode) {
								graph_needsRebuild = grabAncestry.assureIsVisible_inClusters();	// change paging
							} else {
								alert('PROGRAMMING ERROR: child of focus is not visible');
							}
						}
						grabAncestry.grab_forShift(SHIFT);
						graph_needsRelayout = true;
					}
				} else if (c.allow_GraphEditing && OPTION) {
					graph_needsRebuild = true;
					u.ancestries_orders_normalize(siblingAncestries, false);
					const wrapped = up ? (index == 0) : (index + 1 == length);
					const goose = ((wrapped == up) ? 1 : -1) * k.halfIncrement;
					const newOrder = newIndex + goose;
					this.relationship?.order_setTo(newOrder);
					u.ancestries_orders_normalize(siblingAncestries);
				}
			}
		}
		return [graph_needsRebuild, graph_needsRelayout];
	}

}
