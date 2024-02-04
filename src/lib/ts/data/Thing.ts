import { k, u, get, Path, ParentRelations, Datum, debug, Predicate, Hierarchy, DebugFlag } from '../common/GlobalImports';
import { TraitType, dbDispatch } from '../common/GlobalImports';
import { s_path_here } from '../managers/State';
import Airtable from 'airtable';

export default class Thing extends Datum {
	parentRelations: ParentRelations;
    bulkRootID: string = '';
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

	constructor(baseID: string, id: string | null, title = k.defaultTitle, color = 'blue', trait = 's', isRemotelyStored: boolean) {
		super(baseID, id, isRemotelyStored);
		this.parentRelations = new ParentRelations(this);
		this.dbType = dbDispatch.db.dbType;
		this.title = title;
		this.color = color;
		this.trait = trait;
	};
	
	get fields():	Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get parentIDs():	Array<string> { return this.parents.map(t => t.id); }
	get parents():		 Array<Thing> { return this.parentRelations.parentsFor(Predicate.idIsAParentOf.hash()); }
	get parentPaths():	  Array<Path> { return this.parentRelations.parentPathsFor(Predicate.idIsAParentOf.hash()); }
	get isHere():			  boolean { return (get(s_path_here).thing()?.id ?? '') == this.id; }
	get idForChildren():	   string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get description():		   string { return this.id + ' \"' + this.title + '\"'; }
	get isBulkAlias():		  boolean { return this.trait == TraitType.bulk; }
	get isRoot():			  boolean { return this == this.hierarchy.root; }
	get hasParents():		  boolean { return this.parentPaths.length > 0; }
	get hierarchy():		Hierarchy { return dbDispatch.db.hierarchy; }
	get titleWidth():		   number { return u.getWidthOf(this.title) }

	log(option: DebugFlag, message: string) {
		debug.log_maybe(option, message + ' ' + this.description);
	}

	debugLog(message: string) {
		this.log(DebugFlag.things, message);
	}

	thing_isInDifferentBulkThan(other: Thing) {
		return this.baseID != other.baseID || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
	}

	async order_setTo(newOrder: number, remoteWrite: boolean = false) {
		this.hierarchy.relationship_getWhereIDEqualsTo(this.id)?.order_setTo(newOrder, remoteWrite);
	}

	async bulk_fetchAll(baseID: string) {
		await dbDispatch.db.fetch_allFrom(baseID)
		await dbDispatch.db.hierarchy?.relationships_remoteCreateMissing(this);
		await dbDispatch.db.hierarchy?.relationships_removeHavingNullReferences();
	}

	revealColor(isReveal: boolean, path: Path): string {
		const showBorder = path.isGrabbed || path.isEditing || this.isExemplar;
		const useThingColor = isReveal != showBorder;
		return useThingColor ? this.color : k.backgroundColor;
	}

	updateColorAttributes(path: Path) {
		if (path.isEditing) {
			u.noop();
		}
		const border = (path.isEditing ? 'dashed' : 'solid') + ' 1px ';
		const hover = border + this.revealColor(true, path);
		const grab = border + this.revealColor(false, path);
		this.borderAttribute = border;
		this.hoverAttributes = hover;
		this.grabAttributes = grab;
	}

}
