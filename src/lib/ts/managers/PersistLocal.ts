import { s_setup, s_showDetails, s_line_stretch, s_user_graphOffset } from './State';
import { k, Path, Point, applyScale, dbDispatch } from '../common/GlobalImports'
import { s_db_loadTime, s_title_atTop, s_paths_grabbed } from './State';
import { s_path_here, s_row_height, s_paths_expanded } from './State';
import { s_thing_fontFamily, s_show_child_graph } from './State';

export enum IDPersistant {
	relationships	= 'relationships',
	show_children  	= 'show_children',
	line_stretch 	= 'line_stretch',
	title_atTop  	= 'title_atTop',
	row_height   	= 'row_height',
	expanded	 	= 'expanded',
	controls	 	= 'controls',
	grabbed		 	= 'grabbed',
	details		 	= 'details',
	origin		 	= 'origin',
	scale		 	= 'scale',
	here		 	= 'here',
	font		 	= 'font',
	db			 	= 'db',
}

class PersistLocal {
	// for backwards compatibility with {here,grabbed, expanded} stored as ids not path strings of relationship ids
	usesRelationships = localStorage[IDPersistant.relationships];
	ignorePaths = !this.usesRelationships || this.usesRelationships == 'undefined';

	restore() {
		// localStorage.clear();
		// const isLocal = u.isServerLocal();
		// this.writeToKey(IDPersistant.row_height, 20);
		// this.writeToKey(IDPersistant.dot_size, 13);

		if (this.ignorePaths) {
			this.writeToKey(IDPersistant.relationships, true);
		}
		s_db_loadTime.set(null);
		this.writeToKey(IDPersistant.title_atTop, false);
		applyScale(this.readFromKey(IDPersistant.scale) ?? 1);
		k.showControls = this.readFromKey(IDPersistant.controls) ?? false;
		s_row_height.set(this.readFromKey(IDPersistant.row_height) ?? 20);
		s_showDetails.set(this.readFromKey(IDPersistant.details) ?? false);
		s_line_stretch.set(this.readFromKey(IDPersistant.line_stretch) ?? 30);
		s_title_atTop.set(this.readFromKey(IDPersistant.title_atTop) ?? false);
		s_thing_fontFamily.set(this.readFromKey(IDPersistant.font) ?? 'Arial');
		s_show_child_graph.set(this.readFromKey(IDPersistant.show_children) ?? true);
		s_user_graphOffset.set(this.readFromKey(IDPersistant.origin) ?? new Point());
		s_show_child_graph.subscribe((flag: boolean) => {
			this.writeToKey(IDPersistant.show_children, flag);
		})
	}

	paths_restore() {
		const h = dbDispatch.db.hierarchy;
		k.hierarchy = h;
		const idHere = this.ignorePaths ? '' : (this.readFromDBKey(IDPersistant.here) ?? h.idRoot);
		s_paths_grabbed.set(this.ignorePaths ? [] : this.readFromDBKey(IDPersistant.grabbed)?.map((s: string) => h.path_remember_unique(s)) ?? []);
		s_paths_expanded.set(this.ignorePaths ? [] : this.readFromDBKey(IDPersistant.expanded)?.map((e: string) => h.path_remember_unique(e)) ?? []);
		s_path_here.set(h.path_remember_unique(idHere));
		k.rootPath = h.path_remember_unique();
		k.rootPath.setup();
		s_setup();

		s_paths_grabbed.subscribe((paths: Array<Path>) => {
			this.writeToDBKey(IDPersistant.grabbed, paths.map(p => p.pathString));
		});

		s_paths_expanded.subscribe((paths: Array<Path>) => {
			this.writeToDBKey(IDPersistant.expanded, paths.map(p => p.pathString));
		});

		s_path_here.subscribe((path: Path) => {
			if (path) {
				this.writeToDBKey(IDPersistant.here, path.pathString);
			}
		});
	}

	get dbType(): string { return dbDispatch.db.dbType; }
	readFromDBKey(key: string) { return this.readFromKey(key + this.dbType); }
	writeToDBKey(key: string, value: any) { this.writeToKey(key + this.dbType, value); }
	writeToKey(key: string, value: any) { localStorage[key] = JSON.stringify(value); }

	readFromKey(key: string): any | null {
		const storedValue = localStorage[key];
		if (!storedValue || storedValue == 'undefined') {
			return null;
		} else {
			return JSON.parse(storedValue);
		} 
	}

}

export const persistLocal = new PersistLocal();
