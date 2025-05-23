import { T_Graph, T_Create, T_Element, T_Kinship, T_Predicate, T_Alteration, T_SvelteComponent } from '../common/Global_Imports';
import { Direction, Predicate, Hierarchy, databases, Relationship, Svelte_Wrapper } from '../common/Global_Imports';
import { c, k, p, u, show, Rect, Size, Thing, debug, layout, wrappers, svgPaths } from '../common/Global_Imports';
import { w_hierarchy, w_ancestry_focus, w_s_alteration, w_s_title_edit } from '../common/Stores';
import { w_ancestries_grabbed, w_ancestries_expanded, } from '../common/Stores';
import { w_background_color, w_show_graph_ofType, w_t_database } from '../common/Stores';
import { G_Widget, G_Cluster, G_TreeLine } from '../common/Global_Imports';
import { G_Paging, S_Title_Edit } from '../common/Global_Imports';
import type { Dictionary, Integer } from '../common/Types';
import { T_Database } from '../database/DBCommon';
import { T_Edit } from '../state/S_Title_Edit';
import { get, Writable } from 'svelte/store';
import Identifiable from './Identifiable';

export default class Ancestry extends Identifiable {
	g_widgets: Dictionary<G_Widget> = {};
	t_database: string;
	kind: string;

	// id => ancestry (path) string 
	//   "   composed of ids of each relationship
	// NOTE: first relationship's parent is always the root
	//   "   kind is from the last relationship
	//  	 all children are of that kind of predicate

	constructor(t_database: string, path: string = k.root_path, kind: string = T_Predicate.contains) {
		super(path);
		this.kind = kind;
		this.t_database = t_database;
		this.hierarchy.signal_storage_redraw(0);
	}
	
	static readonly _____TRAVERSE: unique symbol;

	traverse(apply_closureTo: (ancestry: Ancestry) => boolean, t_kinship: T_Kinship = T_Kinship.child, visited: Array<string> = []) {
		const id = this.thing?.id;
		if (!!id && !visited.includes(id) && !apply_closureTo(this)) {
			for (const progeny of this.ancestries_createUnique_byKinship(t_kinship)) {
				progeny.traverse(apply_closureTo, t_kinship, [...visited, id]);
			}
		}
	}

	async async_traverse(apply_closureTo: (ancestry: Ancestry) => Promise<boolean>, t_kinship: T_Kinship = T_Kinship.child, visited: Array<string> = []) {
		const id = this.thing?.id;
		if (!!id && !visited.includes(id)) {
			try {
				if (!await apply_closureTo(this)) {
					for (const progeny of this.ancestries_createUnique_byKinship(t_kinship)) {
						await progeny.async_traverse(apply_closureTo, t_kinship, [...visited, id]);
					}
				}
			} catch (error) {
				console.error('Error during async_traverse:', error);
			}
		}
	}
	
	static readonly _____FOCUS: unique symbol;

	becomeFocus(force: boolean = false): boolean {
		const priorFocus = get(w_ancestry_focus);
		const changed = force || !priorFocus || !this.equals(priorFocus!);
		if (changed) {
			w_s_alteration.set(null);
			w_ancestry_focus.set(this);
		}
		this.expand();
		return changed;
	}

	static readonly _____THINGS: unique symbol;

	get thing():	 Thing | null { return this.hierarchy.thing_forAncestry(this); }
	get children():	 Array<Thing> { return this.hierarchy.things_forAncestries(this.childAncestries); }
	get ancestors(): Array<Thing> { return this.hierarchy.things_forAncestry(this); }
	get parents():	 Array<Thing> { return this.thing?.parents ?? []; }

	thingAt(back: number): Thing | null {			// 1 == last
		const relationship = this.relationshipAt(back);
		if (!!relationship && !this.isRoot) {
			return relationship.child;
		}
		return this.hierarchy.root;	// N.B., this.hierarchy.root is wrong immediately after switching db type
	}

	things_childrenFor(kind: string): Array<Thing> {
		const relationships = this.thing?.relationships_ofKind_forParents(kind, true);
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

	static readonly _____RELATIONSHIPS: unique symbol;
	
	get relationship():			 Relationship | null { return this.relationshipAt(); }
	get relevantRelationships(): Array<Relationship> { return this.relationships_forChildren(true); }
	get parentRelationships():	 Array<Relationship> { return this.relationships_ofKind_forParents(this.kind, true); }
	get childRelationships():	 Array<Relationship> { return this.relationships_ofKind_forParents(this.kind, false); }

	get relationships(): Array<Relationship> {
		const relationships = this.relationship_hids.map(hid => this.hierarchy.relationship_forHID(hid)) ?? [];
		return u.strip_invalid(relationships);
	}
	
	relationships_ofKind_forParents(kind: string, forParents: boolean): Array<Relationship> {
		return this.thing?.relationships_ofKind_forParents(kind, forParents) ?? [];
	}

	relationships_forChildren(forChildren: boolean): Array<Relationship> { return forChildren ? this.childRelationships : this.parentRelationships; }
	relationshipAt(back: number = 1):				 Relationship | null { return this.hierarchy.relationship_forHID(this.idAt(back).hash()) ?? null; }

	static readonly _____SVG: unique symbol;

	svgPathFor_tinyDots_outsideReveal(points_toChild: boolean): string | null {
		const in_radial_mode = layout.inRadialMode;
		const isVisible_forChild = this.hasChildren && show.children_dots && (in_radial_mode ? true : !this.isExpanded);
		const isVisible_inRadial = points_toChild ? isVisible_forChild : this.hasParents && (this.isBidirectional ? show.related_dots : show.parent_dots);
		const show_outside_tinyDots = in_radial_mode ? isVisible_inRadial : isVisible_forChild;
		const tinyDots_count = this.relationships_count_forChildren(points_toChild);
		return !show_outside_tinyDots ? null : svgPaths.tinyDots_circular(k.diameterOf_outer_tinyDots + 4, tinyDots_count as Integer, this.points_right);
	}

	static readonly _____BIDIRECTIONALS: unique symbol;
	
	get bidirectional_ancestries(): Array<Ancestry> {
		let ancestries: Array<Ancestry> = []
		for (const predicate of get(w_hierarchy).predicates) {
			if (predicate.isBidirectional) {
				const parents = this.thing?.ancestries_forPredicate(predicate);
				if (!!parents) {	// each of the parents is bidirectional TO this ancestry's thing
					ancestries = u.uniquely_concatenateArrays(ancestries, parents);
				}
			}
		}
		return ancestries;
	}

	get g_lines_forBidirectionals(): Array<G_TreeLine> {
		let found: Array<G_TreeLine> = [];
		const depth = this.depth + 1;
		for (const bidirectional of this.bidirectional_ancestries) {
			const others = bidirectional.thing?.ancestries;
			if (!!others) {
				for (const other of others) {
					if (other.isVisible && other.depth > depth && other.pathString != bidirectional.pathString) {
						const g_line = this.g_line_bidirectionaTo(other);
						found.push(g_line);
					}
				}
			}
		}
		return found;
	}

	g_line_bidirectionaTo(other: Ancestry) : G_TreeLine {
		const offset_y = 0.5;
		const g_line = new G_TreeLine(this, other, true);
		const offset_x = -(k.height.line + k.height.dot / 2);
		const extent = other.g_widget.absolute_center_ofDrag;
		const origin = this.g_widget.absolute_center_ofReveal.offsetByXY(2, -2.5);
		const rect = Rect.createExtentRect(origin, extent).offsetByXY(offset_x, offset_y);
		g_line.set_t_curve_forHeight(rect.height);
		g_line.rect = rect;
		return g_line;
	}

	static readonly _____EVENTS: unique symbol;

	handle_singleClick_onDragDot(shiftKey: boolean) {
		if (this.isBidirectional && this.thing?.isRoot) {
			this.hierarchy.rootAncestry.handle_singleClick_onDragDot(shiftKey);
		} else {
			w_s_title_edit?.set(null);
			if (!!get(w_s_alteration)) {
				this.hierarchy.ancestry_alter_connectionTo_maybe(this);
				layout.grand_build();
				return;
			} else if (!shiftKey && layout.inRadialMode) {
				if (this.becomeFocus()) {
					layout.grand_build();
					return;
				}
			} else if (shiftKey || this.isGrabbed) {
				this.toggleGrab();
			} else {
				this.grabOnly();
			}
			layout.grand_layout();
		}
	}

	static readonly _____VISIBILITY: unique symbol;

	assure_isVisible_within(ancestries: Array<Ancestry>) {
		if (!!this.predicate) {
			const index = u.indexOf_withMatchingThingID_in(this, ancestries);
			const g_paging = this.g_cluster?.g_paging;
			if (!!g_paging && !g_paging.index_isVisible(index)) {
				return g_paging.update_index_toShow(index);		// change paging
			}
		}
		return false;
	}

	visibleSubtree_height(visited: Array<string> = []): number {
		const thing = this.thing;
		if (!!thing && !visited.includes(this.pathString)) {
			if (this.shows_branches) {
				let height = 0;
				for (const branchAncestry of this.branchAncestries) {
					height += branchAncestry.visibleSubtree_height([...visited, this.pathString]);
				}
				return Math.max(height, k.height.row);
			}
			return k.height.row;
		}
		return 0;
	}

	visibleSubtree_width(visited: Array<string> = []): number {
		const thing = this.thing;
		if (!!thing) {
			const id = this.id;
			let width = thing.width_ofTitle + 6;
			if (!visited.includes(id) && this.shows_branches) {
				let subtreeWidth = 0;
				for (const branchAncestry of this.branchAncestries) {
					const branchWidth = branchAncestry.visibleSubtree_width([...visited, id]);
					if (subtreeWidth < branchWidth) {
						subtreeWidth = branchWidth;
					}
				}
				width += subtreeWidth + k.height.line + k.height.dot;
			}
			return width;
		}
		return 0;
	}

	visibleSubtree_ancestries(visited: Array<string> = []): Array<Ancestry> {
		let ancestries: Array<Ancestry> = [];
		if (this.isVisible) {
			ancestries.push(this);
		}
		const thing = this.thing;
		if (!!thing) {
			if (!visited.includes(this.pathString) && this.shows_branches) {
				for (const childAncestry of this.childAncestries) {
					const progeny = childAncestry.visibleSubtree_ancestries([...visited, this.pathString]);
					ancestries = [...ancestries, ...progeny];
				}
			}
		}
		return ancestries;
	}

	static readonly _____LAYOUT: unique symbol;

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

	static readonly _____EDIT: unique symbol;

	startEdit() {
		if (this.isEditable && !get(w_s_title_edit)) {
			w_s_title_edit?.set(new S_Title_Edit(this));
			debug.log_edit(`SETUP ${this.title}`);
			this.grabOnly();
		}
	}

	static readonly _____MOVE_UP: unique symbol;

	persistentMoveUp_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean): [boolean, boolean] {
		if (this.points_toChildren) {													// trees and radials
			return this.persistentMoveUp_forChild_maybe(up, SHIFT, OPTION, EXTREME);
		} else if (this.isBidirectional) {												// radials
			return this.persistentMoveUp_forBidirectional_maybe(up, SHIFT, OPTION, EXTREME);
		} else {																		// parents
			return this.persistentMoveUp_forParent_maybe(up, SHIFT, OPTION, EXTREME);
		}
	}

	persistentMoveUp_forChild_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean): [boolean, boolean] {
		const parentAncestry = this.parentAncestry;
		let needs_graphRelayout = false;
		let needs_graphRebuild = false;
		if (!!parentAncestry) {
			const siblings = parentAncestry.children ?? [];
			const length = siblings.length;
			const thing = this?.thing;
			if (length == 0) {		// friendly for first-time users
				this.hierarchy.ancestry_rebuild_runtimeBrowseRight(this, up, SHIFT, EXTREME, true);
			} else if (!!thing) {
				let grabAncestry: Ancestry | null = this;
				const fromOrder = siblings.indexOf(thing);
				const toOrder = fromOrder.increment(!up, length);
				if (!OPTION) {
					grabAncestry = parentAncestry.ancestry_createUnique_byAddingThing(siblings[toOrder]);
					if (!!grabAncestry) {
						grabAncestry.grab_forShift(SHIFT);
						needs_graphRelayout = true;
					}
				} else if (c.allow_GraphEditing) {
					needs_graphRebuild = true;
					this.reorder_within(this.sibling_ancestries, up);
				}
				if (!!grabAncestry) {
					if (layout.inRadialMode) {
						needs_graphRebuild = grabAncestry.assure_isVisible_within(this.sibling_ancestries) || needs_graphRebuild;	// change paging
					} else if (!parentAncestry.isFocus && !grabAncestry.isVisible) {
						needs_graphRebuild = parentAncestry.becomeFocus() || needs_graphRebuild;
					}
				}
			}
		}
		return [needs_graphRebuild, needs_graphRelayout];
	}

	persistentMoveUp_forParent_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean): [boolean, boolean] {
		const sibling_ancestries = get(w_ancestry_focus)?.ancestries_createUnique_byKinship(T_Kinship.parent);
		let needs_graphRelayout = false;
		let needs_graphRebuild = false;
		if (!!sibling_ancestries) {
			let grabAncestry: Ancestry | null = this;
			if (!OPTION) {
				const fromOrder = u.indexOf_withMatchingThingID_in(this, sibling_ancestries);
				const toOrder = fromOrder.increment(!up, sibling_ancestries.length);
				grabAncestry = sibling_ancestries[toOrder];
				if (!!grabAncestry) {
					grabAncestry.grab_forShift(SHIFT);
					needs_graphRelayout = true;
				}
			} else if (c.allow_GraphEditing) {
				needs_graphRebuild = true;
				this.reorder_within(sibling_ancestries, up);
			}
			if (!!grabAncestry) {
				needs_graphRebuild = grabAncestry.assure_isVisible_within(sibling_ancestries) || needs_graphRebuild;
			}
		}
		return [needs_graphRebuild, needs_graphRelayout];
	}

	persistentMoveUp_forBidirectional_maybe(up: boolean, SHIFT: boolean, OPTION: boolean, EXTREME: boolean): [boolean, boolean] {
		const sibling_ancestries = get(w_ancestry_focus)?.ancestries_createUnique_byKinship(T_Kinship.related) ?? [];
		let needs_graphRelayout = false;
		let needs_graphRebuild = false;
		if (!!sibling_ancestries) {
			let grabAncestry: Ancestry | null = this;
			if (!OPTION) {
				const fromOrder = u.indexOf_withMatchingThingID_in(this, sibling_ancestries);
				const toOrder = fromOrder.increment(!up, sibling_ancestries.length);
				grabAncestry = sibling_ancestries[toOrder];
				if (!!grabAncestry) {
					grabAncestry.grab_forShift(SHIFT);
					needs_graphRelayout = true;
				}
			} else if (c.allow_GraphEditing) {
				needs_graphRebuild = true;
				this.reorder_within(sibling_ancestries, up);
			}
			if (!!grabAncestry && !!this.predicate) {
				needs_graphRebuild = grabAncestry.assure_isVisible_within(sibling_ancestries) || needs_graphRebuild;
			}
		}
		return [needs_graphRebuild, needs_graphRelayout];
	}
	
	static readonly _____ORDER: unique symbol;
	
	get order(): number { return this.relationship?.order_forPointsTo(this.points_toChildren) ?? -12345; }
	
	order_setTo(order: number, persist: boolean = false) {
		this.relationship?.order_setTo_forPointsTo(order, this.points_toChildren, persist);
	}

	reorder_within(ancestries: Array<Ancestry>, up: boolean) {
		u.ancestries_orders_normalize(ancestries);
		const length = ancestries.length;
		const fromOrder = ancestries.indexOf(this);
		const toOrder = fromOrder.increment(!up, length);
		const wrapped = up ? (fromOrder == 0) : (fromOrder + 1 == length);
		const nudge = ((wrapped == up) ? 1 : -1) * k.halfIncrement;		// avoid duplicated orders
		this.order_setTo(toOrder + nudge);
		u.ancestries_orders_normalize(ancestries, true);
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

	static readonly _____EXPAND: unique symbol;
	
	expand() { return this.expanded_setTo(true); }
	collapse() { return this.expanded_setTo(false); }
	toggleExpanded() { return this.expanded_setTo(!this.isExpanded); }
	get shows_children(): boolean { return this.isExpanded && this.hasChildren; }
	get shows_branches(): boolean { return p.branches_areChildren ? this.shows_children : !this.isRoot; }
	get isExpanded(): boolean { return this.isRoot || !get(w_ancestries_expanded) || this.includedInStore_ofAncestries(w_ancestries_expanded); }

	remove_fromGrabbed_andExpanded() {
		this.collapse();
		this.ungrab();
	}

	reveal_toFocus() {
		const parentAncestry = this.parentAncestry;
		if (!!parentAncestry && !parentAncestry.isFocus) {
			parentAncestry.reveal_toFocus();
			parentAncestry.expand();
		}
	}
	
	get isAllProgeny_expanded(): boolean {
		let allExpanded = true;
		this.traverse(ancestry => {
			if (!ancestry.isExpanded) {
				allExpanded = false;
				return true;
			}
			return false;
		});
		return allExpanded;
	}

	isAllExpanded_fromRootTo(targetAncestry: Ancestry | null): boolean {
		// visit ancestors until encountering either {targetAncestry, an unexpanded parent}
		if (!!targetAncestry && !this.equals(targetAncestry)) {
			const parentAncestry = this.parentAncestry;			// visit parent of ancestry
			if (!parentAncestry || !parentAncestry.isExpanded) {
				return false;	// stop when no ancestor [root] or not expanded
			} else if (!!parentAncestry && !parentAncestry.isAllExpanded_fromRootTo(targetAncestry)) {
				return false;
			}
		}
		return true;
	}
	
	expanded_setTo(expand: boolean) {
		let mutated = false;
		const matchesDB = this.t_database == get(w_t_database);
		if (matchesDB && (!this.isRoot || expand)) {
			if (!get(w_ancestries_expanded)) {
				w_ancestries_expanded.set([]);
			}
			w_ancestries_expanded.update((a) => {
				let array = a ?? [];
				if (!!array) {
					const index = array.map(a => a.pathString).indexOf(this.pathString);
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

	static readonly _____GRAB: unique symbol;
	
	toggleGrab() { if (this.isGrabbed) { this.ungrab(); } else { this.grab(); } }

	grabOnly() {
		debug.log_grab(`  GRAB ONLY "${this.title}"`);
		w_ancestries_grabbed.set([this]);
		this.hierarchy.stop_alteration();
	}

	grab_forShift(SHIFT: boolean) {
		if (SHIFT) {
			this.grab();
		} else {
			this.grabOnly();
		}
	}

	grab() {
		let grabs = get(w_ancestries_grabbed) ?? [];
		if (!!grabs) {
			const index = grabs.indexOf(this);
			if (grabs.length == 0) {
				grabs.push(this);
			} else if (index != grabs.length - 1) {	// not already last?
				if (index != -1) {					// found: remove
					grabs.splice(index, 1);
				}
				grabs.push(this);					// always add last
			}
		}
		w_ancestries_grabbed.set(grabs);
		debug.log_grab(`  GRAB "${this.title}"`);
		this.hierarchy.stop_alteration();
	}

	ungrab() {
		w_s_title_edit?.set(null);
		let grabs = get(w_ancestries_grabbed) ?? [];
		const rootAncestry = this.hierarchy.rootAncestry;
		if (!!grabs) {
			const index = grabs.indexOf(this);
			if (index != -1) {				// only splice grabs when item is found
				grabs.splice(index, 1);		// 2nd parameter means remove one item only
			}
			if (grabs.length == 0) {
				grabs.push(rootAncestry);
			}
		}
		if (grabs.length == 0 && layout.inTreeMode) {
			grabs = [rootAncestry];
		} else {
			this.hierarchy.stop_alteration(); // do not show editingTools for root
		}
		w_ancestries_grabbed.set(grabs);
		debug.log_grab(`  UNGRAB "${this.title}"`);
	}

	static readonly _____ALTERATION: unique symbol;

	get alteration_isAllowed(): boolean {
		const s_alteration = get(w_s_alteration);
		const predicate = s_alteration?.predicate;
		if (!!s_alteration && !!predicate) {
			const from_ancestry = s_alteration.ancestry;
			const from_thing = from_ancestry?.thing;
			const to_thing = this.thing;
			if (!!to_thing && !!from_thing && to_thing.hid != from_thing.hid && !from_ancestry.equals(this)) {
				const isBidirectional = predicate.isBidirectional;
				const isFrom_anAncestor = isBidirectional ? false : to_thing.parentIDs.includes(from_thing.id);
				const isParent_ofFrom = this.thing_isImmediateParentOf(from_ancestry, predicate.kind);
				const isProgeny_ofFrom = this.isAProgenyOf(from_ancestry);
				const isAdding = s_alteration.t_alteration == T_Alteration.add;
				const creates_cycle = isParent_ofFrom || isProgeny_ofFrom || isFrom_anAncestor;
				const canAlter = isAdding ? !creates_cycle : isParent_ofFrom;
				return canAlter
			}
		}
		return false;
	}

	static readonly _____OTHER_ANCESTRIES: unique symbol;

	get parentAncestry():	  Ancestry | null { return this.ancestry_createUnique_byStrippingBack(); }
	get sibling_ancestries(): Array<Ancestry> { return this.parentAncestry?.childAncestries ?? []; }
	get childAncestries():	  Array<Ancestry> { return this.ancestries_createUnique_byKinship(T_Kinship.child) ?? []; }
	get branchAncestries():	  Array<Ancestry> { return p.branches_areChildren ? this.childAncestries : this.parentAncestries; }

	get parentAncestries(): Array<Ancestry> {
		let ancestries = this.thing?.ancestries ?? [];
		ancestries = ancestries.map(a => a.parentAncestry).filter(a => !!a).filter(a => !a.equals(this) && a.depth < this.depth);
		return ancestries;
	}

	get ancestry_ofFirst_visibleChild(): Ancestry {
		const childAncestries = this.childAncestries;
		const first = childAncestries[0]
		if (layout.inRadialMode) {
			const g_paging = this.g_paging
			const maybe = g_paging?.ancestry_atIndex(childAncestries);
			if (!!maybe) {
				return maybe;
			}
		}
		return first;
	}

	visibleParentAncestries(back: number = 1): Array<Ancestry> {
		const ancestries: Array<Ancestry> = [];
		const parents = this.parentAncestries;
		for (const parent of parents) {
			const ancestor = parent.ancestry_createUnique_byStrippingBack(back);
			if (!!ancestor && ancestor.isVisible) {
				ancestries.push(parent);
			}
		}
		return ancestries;
	}

	ancestry_ofNextSibling(increment: boolean): Ancestry | null {
		const array = this.sibling_ancestries;
		const index = array.map(a => a.pathString).indexOf(this.pathString);
		if (index != -1) {
			let siblingIndex = index.increment(increment, array.length)
			if (index == 0) {
				siblingIndex = 1;
			}
			return array[siblingIndex];
		}
		return null;
	}

	ancestry_createUnique_byAddingThing(thing: Thing | null): Ancestry | null {
		const hidParent = this.thing?.idBridging.hash();
		if (!!thing && !!hidParent) {
			const relationship = this.hierarchy.relationship_forPredicateKind_parent_child(T_Predicate.contains, hidParent, thing.hid);
			if (!!relationship) {
				return this.ancestry_createUnique_byAppending_relationshipID(relationship.id);
			}
		}
		return null;
	}

	ancestry_createUnique_byStrippingBack(back: number = 1): Ancestry | null {
		const ids = this.relationship_ids;
		if (back == 0) {
			return this;
		} else if (ids.length == 0) {
			return null;
		}
		const stripped_ids = ids.slice(0, -back);
		if (stripped_ids.length == 0) {
			return this.hierarchy.rootAncestry;
		} else {
			return this.hierarchy.ancestry_remember_createUnique(stripped_ids.join(k.separator.generic));
		}
	}

	ancestry_createUnique_byAppending_relationshipID(id: string): Ancestry | null {
		if (this.isRoot) {
			return this.hierarchy.ancestry_remember_createUnique(id);
		} else {
			let ids = this.relationship_ids;
			ids.push(id);
			const ancestry = this.hierarchy.ancestry_remember_createUnique(ids.join(k.separator.generic));
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

	ancestry_remember_createUnique_byAddingThing(thing: Thing | null, kind: T_Predicate = T_Predicate.contains): Ancestry | null {
		const h = this.hierarchy;
		const parent = this.thing;
		let ancestry: Ancestry | null = null;
		if (!!thing && !!parent) {
			const changingBulk = parent.isBulkAlias || thing.idBase != h.db.idBase;
			const idBase = changingBulk ? thing.idBase : parent.idBase;
			const parentOrder = this.childAncestries?.length ?? 0;
			const relationship = h.relationship_remember_createUnique(idBase, Identifiable.newID(), kind, parent.idBridging, thing.id, 0, parentOrder, T_Create.getPersistentID);
			ancestry = this.ancestry_createUnique_byAppending_relationshipID(relationship.id);
			u.ancestries_orders_normalize(this.childAncestries, true);			// write new order values for relationships
			if (kind != T_Predicate.contains) {									// if isBidirectional, we need to create the reversed relationship
				const reversed = relationship?.reversed_remember_createUnique;	// do not persist, it is automatically recreated on all subsequennt launches
				if (!!reversed) {												// use relationship's id alone, since it is an isRelated kind
					h.ancestry_remember_createUnique(relationship.id, kind);			
				}
			}
		}
		return ancestry;
	}

	async ancestry_persistentCreateUnique_byAddingThing(thing: Thing | null, kind: T_Predicate = T_Predicate.contains): Promise<Ancestry | null | undefined> {
		const h = this.hierarchy;
		const parent = this.thing;
		let ancestry: Ancestry | null = null;
		if (!!thing && !!parent) {
			const changingBulk = parent.isBulkAlias || thing.idBase != h.db.idBase;
			const idBase = changingBulk ? thing.idBase : parent.idBase;
			if (!thing.persistence.already_persisted) {
				await h.db.thing_remember_persistentCreate(thing);				// for everything below, need to await while thing.id is fetched from remote database
			}
			const parentOrder = this.childAncestries?.length ?? 0;
			const relationship = await h.relationship_remember_persistentCreateUnique(idBase, Identifiable.newID(), kind, parent.idBridging, thing.id, 0, parentOrder, T_Create.getPersistentID);
			ancestry = this.ancestry_createUnique_byAppending_relationshipID(relationship.id);
			u.ancestries_orders_normalize(this.childAncestries, true);			// write new order values for relationships
			if (kind != T_Predicate.contains) {									// if isBidirectional, we need to create the reversed relationship
				const reversed = relationship?.reversed_remember_createUnique;	// do not persist, it is automatically recreated on all subsequennt launches
				if (!!reversed) {												// use relationship's id alone, since it is an isRelated kind
					h.ancestry_remember_createUnique(relationship.id, kind);			
				}
			}
		}
		return ancestry;
	}

	ancestries_createUnique_byKinship(kinship: string | null): Array<Ancestry> {
		if (!!kinship) {
			switch (kinship) {
				case T_Kinship.related: return this.thing?.uniqueAncestries_for(Predicate.isRelated) ?? [];
				case T_Kinship.parent:  return this.thing?.uniqueAncestries_for(Predicate.contains) ?? [];
				case T_Kinship.child:   return this.ancestries_createUnique_forPredicate(Predicate.contains);
			}
		}
		return [];
	}

	ancestries_createUnique_forPredicate(predicate: Predicate | null): Array<Ancestry> {
		let ancestries: Array<Ancestry> = [];
		if (!!predicate) {
			const relationships = this.relationships_ofKind_forParents(predicate.kind, false);
			const isContains = predicate.kind == T_Predicate.contains;
			if (relationships.length > 0) {
				for (const relationship of relationships) {
					if (relationship.kind == predicate.kind) {
						let ancestry: Ancestry | null;
						if (isContains) {
							ancestry = this.ancestry_createUnique_byAppending_relationshipID(relationship.id); 	// add each relationship's id
						} else {
							ancestry = this.hierarchy.ancestry_remember_createUnique(relationship.id, predicate.kind);
						}
						if (!!ancestry) {
							ancestries.push(ancestry);									// and push onto the ancestries
						}
					}
				}
				if (isContains) {
					u.ancestries_orders_normalize(ancestries, true);					// normalize order of children only
				}
			}
		}
		return ancestries;
	}

	static readonly _____PROPERTIES: unique symbol;
	
	get isRoot():						 boolean { return this.pathString == k.root_path; }
	get hasSiblings():					 boolean { return this.sibling_ancestries.length > 1; }
	get hasChildren():					 boolean { return this.childRelationships.length > 0; }
	get hasParents():					 boolean { return this.parentRelationships.length > 0; }
	get isFocus():						 boolean { return this.matchesStore(w_ancestry_focus); }
	get hasRelevantRelationships():		 boolean { return this.relevantRelationships_count > 0; }
	get points_toChildren():			 boolean { return this.g_cluster?.points_toChildren ?? true }
	get isBidirectional():				 boolean { return this.predicate?.isBidirectional ?? false; }
	get shows_reveal():					 boolean { return this.showsReveal_forPointingToChild(true); }
	get isGrabbed():					 boolean { return this.includedInStore_ofAncestries(w_ancestries_grabbed); }
	get isInvalid():					 boolean { return this.containsReciprocals || this.containsMixedPredicates; }
	get hasRelationships():				 boolean { return this.hasParents || this.hasChildren; }
	get isEditing():					 boolean { return get(w_s_title_edit)?.isAncestry_inState(this, T_Edit.editing) ?? false; }
	get description():				   	  string { return `${this.kind} "${this.thing?.t_thing ?? '-'}" ${this.titles.join(':')}`; }
	get title():					   	  string { return this.thing?.title ?? 'missing title'; }
	get abbreviated_title():			  string { return this.thing?.abbreviated_title ?? '?'; }
	get pathString():					  string { return this.id; }
	get depth():						  number { return this.relationship_ids.length; }
	get visibleSubtree_halfHeight():   	  number { return this.visibleSubtree_height() / 2; }
	get relevantRelationships_count():	  number { return this.relevantRelationships.length; }
	get direction_ofReveal():			  number { return this.points_right ? Direction.right : Direction.left; }
	get siblingIndex():				   	  number { return this.sibling_ancestries.map(a => a.pathString).indexOf(this.pathString); }
	get visibleSubtree_size():				Size { return new Size(this.visibleSubtree_width(), this.visibleSubtree_height()); }
	get visibleSubtree_halfSize():			Size { return this.visibleSubtree_size.dividedInHalf; }
	get lastChild():					   Thing { return this.children.slice(-1)[0]; }
	get firstChild():					   Thing { return this.children[0]; }
	get g_widget():						G_Widget { return this.g_widget_forGraphMode(get(w_show_graph_ofType)); }
	get hierarchy():				   Hierarchy { return get(w_hierarchy); }
	get titleRect():				 Rect | null { return this.rect_ofWrapper(this.titleWrapper); }
	get idBridging():			   string | null { return this.thing?.idBridging ?? null; }
	get g_cluster():			G_Cluster | null { return this.g_widget.g_cluster ?? null; }
	get g_paging():				 G_Paging | null { return this.g_cluster?.g_paging_forAncestry(this) ?? null; }
	get predicate():			Predicate | null { return this.hierarchy.predicate_forKind(this.kind) }
	get titleWrapper():	   Svelte_Wrapper | null { return wrappers.wrapper_forHID_andType(this.hid, T_SvelteComponent.title); }
	get relationship_hids():	  Array<Integer> { return this.relationship_ids.map(i => i.hash()); }
	get relationship_ids():		  Array <string> { return this.isRoot ? [] : this.pathString.split(k.separator.generic); }
	get titles():			  	  Array <string> { return this.ancestors?.map(a => `${!a ? 'null' : a.title}`) ?? []; }

	get points_right(): boolean {
		const radial_points_right = this.g_widget?.widget_pointsRight ?? true;
		const hasVisibleChildren = this.isExpanded && this.hasChildren;
		return layout.inRadialMode ? radial_points_right : !hasVisibleChildren;
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
		if (this.shows_reveal) {
			return svgPaths.fat_polygon(k.height.dot, this.direction_ofReveal);
		}
		return svgPaths.circle_atOffset(k.height.dot, k.height.dot - 1);
	}

	get isVisible(): boolean {
		if (layout.inRadialMode) {
			const parent = this.parentAncestry;
			const g_paging = parent?.g_paging;
			return this.isFocus || (!!parent && parent.isFocus && (g_paging?.index_isVisible(this.siblingIndex) ?? true));
		} else {
			const focus = get(w_ancestry_focus);
			const incorporates = this.incorporates(focus);
			const expanded = this.isAllExpanded_fromRootTo(focus);
			return (incorporates && expanded);
		}
	}

	get hasGrandChildren(): boolean {
		if (this.hasChildren) {
			for (const childAncestry of this.childAncestries) {
				if (childAncestry.hasChildren) {
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
		let kind: string | null = null;
		for (const relationship of this.relationships) {
			if (!kind) {
				kind = relationship.kind;
			}
			if (!!kind &&
				(kind != this.kind ||
				![kind, this.kind].includes(relationship.kind))) {
				return true;
			}
		}
		return false;
	}
	
	relationships_count_forChildren(forChildren: boolean):					number { return this.relationships_forChildren(forChildren).length; }
	sharesAnID(ancestry: Ancestry | null):								   boolean { return !ancestry ? false : this.relationship_ids.some(id => ancestry.relationship_ids.includes(id)); }
	showsCluster_forPredicate(predicate: Predicate):					   boolean { return this.hasParents_ofKind(predicate.kind) && this.hasThings(predicate); }
	equals(ancestry: Ancestry | null | undefined):						   boolean { return super.equals(ancestry) && this.t_database == ancestry?.t_database; }
	includedInStore_ofAncestries(store: Writable<Array<Ancestry> | null>): boolean { return !!get(store) && this.includedInAncestries(get(store)!); }
	hasParents_ofKind(kind: string):									   boolean { return this.thing?.hasParents_ofKind(kind) ?? false; }
	isChildOf(other: Ancestry):											   boolean { return this.id_thing == other.thingAt(2)?.id; }
	matchesStore(store: Writable<Ancestry | null>):						   boolean { return get(store)?.equals(this) ?? false; }
	rect_ofWrapper(wrapper: Svelte_Wrapper | null):					   Rect | null { return wrapper?.boundingRect ?? null; }

	showsReveal_forPointingToChild(points_toChild: boolean): boolean {
		return !(this.predicate?.isBidirectional ?? true) && ((this.relationships_count_forChildren(points_toChild) > 0) || (this.thing?.isBulkAlias ?? false));
	}

	thing_isImmediateParentOf(ancestry: Ancestry, kind: string): boolean {
		const id_thing = this.id_thing;
		if (id_thing != k.unknown) {
			const parents = ancestry.thing?.parents_ofKind(kind);
			return parents?.map(t => t.id).includes(id_thing) ?? false;
		}
		return false;
	}

	includedInAncestries(ancestries: Array<Ancestry> | undefined): boolean {
		const included = ancestries?.filter(a => {
			return this.equals(a);
		});
		return (included?.length ?? 0) > 0;
	}

	hasThings(predicate: Predicate): boolean {
		switch (predicate.kind) {
			case T_Predicate.contains:  return this.thing?.hasParents_ofKind(predicate.kind) ?? false;
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

	g_widget_forGraphMode(t_graph: T_Graph) {
		let g_widget = this.g_widgets[t_graph];
		if (!g_widget) {
			g_widget = G_Widget.empty(this);
			this.g_widgets[t_graph] = g_widget;
		}
		return g_widget;
	}

	isHoverInverted(type: string): boolean {
		const isInverted = this.isGrabbed || this.isEditing;
		switch (type) {
			case T_Element.reveal: return layout.inTreeMode && this.isExpanded == isInverted;
			default: return isInverted;
		}
	}

	dotColor(isInverted: boolean = false): string {
		const thing = this.thing;
		const showBorder = this.isGrabbed || this.isEditing;
		if (!!thing && (isInverted != showBorder)) {
			console.log(thing.title)
			return thing.color;
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

	isAProgenyOf(ancestry: Ancestry): boolean {
		let isAProgeny = false;
		if (!ancestry.isBidirectional) {
			ancestry.traverse((progenyAncestry: Ancestry) => {
				if (this.equals(progenyAncestry)) {
					isAProgeny = true;
					return true;	// stop traversal
				}
				return false;
			})
		}
		return isAProgeny;
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

}
