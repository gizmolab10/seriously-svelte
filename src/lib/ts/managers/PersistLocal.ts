import { g, k, Path, Point, dbDispatch } from '../common/GlobalImports'
import { s_thing_fontFamily, s_show_child_graph } from './State';
import { s_show_details, s_user_graphOffset } from './State';
import { s_path_here, s_paths_expanded } from './State';
import { s_paths_grabbed } from './State';

export enum IDPersistant {
	relationships	= 'relationships',
	show_children  	= 'show_children',
	title_atTop  	= 'title_atTop',
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
		this.writeToKey(IDPersistant.title_atTop, false);
		g.showControls = this.readFromKey(IDPersistant.controls) ?? false;
		s_show_details.set(this.readFromKey(IDPersistant.details) ?? false);
		g.titleIsAtTop = this.readFromKey(IDPersistant.title_atTop) ?? false;
		s_thing_fontFamily.set(this.readFromKey(IDPersistant.font) ?? 'Arial');
		s_show_child_graph.set(this.readFromKey(IDPersistant.show_children) ?? true);
		s_user_graphOffset.set(this.readFromKey(IDPersistant.origin) ?? new Point());
		g.applyScale(!k.device_isMobile ? 1 : this.readFromKey(IDPersistant.scale) ?? 1);

		s_show_details.subscribe((_) => { g.graphRect_update(); });
		s_show_child_graph.subscribe((flag: boolean) => {
			this.writeToKey(IDPersistant.show_children, flag);
		})
	}

	here_restore() {
		const h = g.hierarchy;
		const herePathString = this.readFromDBKey(IDPersistant.here);
		let pathToHere = this.ignorePaths ? g.rootPath : h.path_remember_unique(herePathString ?? h.idRoot);
		let here = h.thing_getForPath(pathToHere);
		if (here == null) {
			pathToHere = h.grabs.path_lastGrabbed?.fromPath ?? g.rootPath;
		}
		pathToHere.becomeHere();
	}

	paths_restore() {
		const h = g.hierarchy;
		g.rootPath = h.path_remember_unique();
		const herePathString = this.readFromDBKey(IDPersistant.here) ?? '';
		let pathToHere = this.ignorePaths ? g.rootPath : h.path_remember_unique(herePathString ?? h.idRoot);
		let here = h.thing_getForPath(pathToHere);
		if (here == null) {
			pathToHere = h.grabs.path_lastGrabbed?.fromPath ?? g.rootPath;
		}
		s_paths_grabbed.set(this.ignorePaths ? [] : this.readFromDBKey(IDPersistant.grabbed)?.map((s: string) => h.path_remember_unique(s)) ?? [g.rootPath]);
		pathToHere.becomeHere();
		this.cleanupExpandeds();

		s_paths_grabbed.subscribe((paths: Array<Path>) => {
			this.writeToDBKey(IDPersistant.grabbed, !paths ? null : paths.map(p => p.pathString));
		});

		s_paths_expanded.subscribe((paths: Array<Path>) => {
			this.writeToDBKey(IDPersistant.expanded, !paths ? null : paths.map(p => p.pathString));
		});

		s_path_here.subscribe((path: Path) => {
			this.writeToDBKey(IDPersistant.here, !path ? null : path.pathString);
		});
	}

	cleanupExpandeds() {
		const h = g.hierarchy;
		let paths = this.ignorePaths ? [] : this.readFromDBKey(IDPersistant.expanded)?.map((e: string) => h.path_remember_unique(e)) ?? [];
		let index = paths.length - 1;
		while (index >= 0) {
			const path = paths[index];
			if (path) {
				for (const id of path.ids) {
					const relationship = h.relationship_getForHID(id.hash());
					if (!relationship) {
						paths.slice(1, index);
					}
				}
			}
			index--;
		};
		s_paths_expanded.set(paths);
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
