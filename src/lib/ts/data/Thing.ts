import { k, u, get, Path, Datum, debug, Predicate, Hierarchy, DebugFlag } from '../common/GlobalImports';
import { IDTrait, dbDispatch } from '../common/GlobalImports';
import { s_path_here } from '../managers/State';
import Airtable from 'airtable';

export default class Thing extends Datum {
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
		this.dbType = dbDispatch.db.dbType;
		this.title = title;
		this.color = color;
		this.trait = trait;
	};
	
	get fields():	Airtable.FieldSet { return { title: this.title, color: this.color, trait: this.trait }; }
	get parentIDs():	Array<string> { return this.parents.map(t => t.id); }
	get parents():		 Array<Thing> { return this.fromThingsFor(Predicate.idIsAParentOf); }
	get parentPaths():	  Array<Path> { return this.fromPathsFor(Predicate.idIsAParentOf); }
	get isHere():			  boolean { return (get(s_path_here).thing?.id ?? '') == this.id; }
	get idForChildren():	   string { return this.isBulkAlias ? this.bulkRootID : this.id; }
	get description():		   string { return this.id + ' \"' + this.title + '\"'; }
	get isBulkAlias():		  boolean { return this.trait == IDTrait.bulk; }
	get isRoot():			  boolean { return this == this.hierarchy.root; }
	get hierarchy():		Hierarchy { return dbDispatch.db.hierarchy; }
	get titleWidth():		   number { return u.getWidthOf(this.title) }
	
	debugLog(message: string) { this.log(DebugFlag.things, message); }
	log(option: DebugFlag, message: string) { debug.log_maybe(option, message + ' ' + this.description); }
	fromThingsFor(predicateID: string): Array<Thing> { return this.fromPathsFor(predicateID).map(p => p.thing!); }

	thing_isInDifferentBulkThan(other: Thing) {
		return this.baseID != other.baseID || (other.isBulkAlias && !this.isBulkAlias && this.baseID != other.title);
	}

	fromPathsFor(predicateID: string): Array<Path> {
		const paths: Array<Path> = [];
		if (!this.isRoot) {
			const fromRelationships = this.hierarchy.relationships_getByPredicateIDToAndID(predicateID, true, this.id);
			for (const fromRelationship of fromRelationships) {
				const endID = fromRelationship.id;
				const fromThing = fromRelationship.thing(false);
				const fromPaths = fromThing?.fromPathsFor(predicateID) ?? [];
				if (fromPaths.length == 0) {
					paths.push(new Path(endID));
				} else {
					for (const fromPath of fromPaths) {
						console.log(`FROM ${fromThing!.title} TO ${this.title}`);
						paths.push(fromPath.appendID(endID));
					}
				}
			}
		}
		return paths;
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
