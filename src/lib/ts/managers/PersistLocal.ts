import { s_thing_fontFamily, s_show_child_graph } from '../common/State';
import { g, k, u, Path, Point, dbDispatch } from '../common/GlobalImports'
import { s_show_details, s_user_graphOffset } from '../common/State';
import { s_path_here, s_paths_expanded } from '../common/State';
import { s_paths_grabbed } from '../common/State';

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
	pathsRestored = false;

	restore() {
		// localStorage.clear();
		// const isLocal = u.isServerLocal;
		// this.writeToKey(IDPersistant.row_height, 20);
		// this.writeToKey(IDPersistant.dot_size, 13);

		if (this.ignorePaths) {
			this.writeToKey(IDPersistant.relationships, true);
		}
		this.writeToKey(IDPersistant.title_atTop, false);
		k.showControls = this.readFromKey(IDPersistant.controls) ?? false;
		s_show_details.set(this.readFromKey(IDPersistant.details) ?? false);
		k.titleIsAtTop = this.readFromKey(IDPersistant.title_atTop) ?? false;
		s_thing_fontFamily.set(this.readFromKey(IDPersistant.font) ?? 'Arial');
		s_show_child_graph.set(this.readFromKey(IDPersistant.show_children) ?? true);
		s_user_graphOffset.set(this.readFromKey(IDPersistant.origin) ?? new Point());
		g.applyScale(!u.device_isMobile ? 1 : this.readFromKey(IDPersistant.scale) ?? 1);

		s_show_details.subscribe((_) => { g.graphRect_update(); });
		s_show_child_graph.subscribe((flag: boolean) => {
			this.writeToKey(IDPersistant.show_children, flag);
		})
	}

	paths_restore() {
		if (!this.pathsRestored) {
			this.pathsRestored = true;
			const h = g.hierarchy;
			g.rootPath = h.path_remember_unique();
			this.here_restore();
			s_paths_grabbed.set(this.store_restore(IDPersistant.grabbed));
			s_paths_expanded.set(this.store_restore(IDPersistant.expanded));
	
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
	}

	here_restore() {
		const h = g.hierarchy;
		let pathToHere = g.rootPath;
		if (!this.ignorePaths) {
			const herePathString = this.readFromDBKey(IDPersistant.here);
			if (herePathString) {
				const herePath = h.path_remember_unique(herePathString);
				if (herePath) {
					pathToHere = herePath;
				}
			}
		}
		let here = h.thing_getForPath(pathToHere);
		if (here == null) {
			const lastGrabbedPath = h.grabs.path_lastGrabbed?.fromPath;
			if (lastGrabbedPath) {
				pathToHere = lastGrabbedPath;
			}
		}
		pathToHere.becomeHere();
	}

	store_restore(key: string): Array<Path> {
		const h = g.hierarchy;
		let paths = this.ignorePaths ? [] : this.readFromDBKey(key)?.map((e: string) => h.path_remember_unique(e)) ?? [];
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
		return paths;
	}

	get dbType(): string { return dbDispatch.db.dbType; }
	readFromDBKey(key: string) { return this.readFromKey(key + this.dbType); }
	writeToKey(key: string, value: any) { localStorage[key] = JSON.stringify(value); }
	writeToDBKey(key: string, value: any) { this.writeToKey(key + this.dbType, value); }

	readFromKey(key: string): any | null {
		const storedValue = localStorage[key];
		if (!storedValue || storedValue == 'undefined') {
			return null;
		} else {
			return JSON.parse(storedValue);
		} 
	}

	applyQueryStrings() {
		const queryStrings = k.queryString;
        const erase = queryStrings.get('erase');
        const titleFlag = queryStrings.get('locate')?.split(k.comma).includes('titleAtTop') ?? false;
		this.writeToKey(IDPersistant.title_atTop, titleFlag);
		k.titleIsAtTop = titleFlag;
		if (queryStrings.get('controls') === 'show') {
			this.writeToKey(IDPersistant.controls, true);
			g.showControls = true;
		}
		if (queryStrings.get('details') === 'hide') {
			this.writeToKey(IDPersistant.details, false);
			s_show_details.set(false);
		}
        if (erase) {
            for (const option of erase.split(k.comma)) {
                switch (option) {
                    case 'data':
						dbDispatch.eraseDB = true;
						break;
                    case 'settings': 
						localStorage.clear();
						s_path_here.set(g.rootPath);
						s_paths_grabbed.set([]);
						s_paths_expanded.set([]);
						break;
                }
            }
        }
    }
}

export const persistLocal = new PersistLocal();
