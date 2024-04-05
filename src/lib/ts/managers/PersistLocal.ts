import { g, k, u, Path, Point, signals, dbDispatch } from '../common/GlobalImports'
import { s_thing_fontFamily, s_show_child_graph } from '../common/State';
import { s_show_details, s_user_graphOffset } from '../common/State';
import { s_paths_grabbed, s_paths_expanded } from '../common/State';
import { s_path_here, s_layout_byClusters } from '../common/State';

export enum IDPersistant {
	relationships = 'relationships',
	show_children = 'show_children',
	title_atTop   = 'title_atTop',
	expanded	  = 'expanded',
	controls	  = 'controls',
	grabbed		  = 'grabbed',
	details		  = 'details',
	layout		  = 'layout',
	origin		  = 'origin',
	scale		  = 'scale',
	here		  = 'here',
	font		  = 'font',
	db			  = 'db',
}

class PersistLocal {
	// for backwards compatibility with {here, grabbed, expanded} which were stored as relationship ids (not as path strings)
	usesRelationships = localStorage[IDPersistant.relationships];
	ignorePaths = !this.usesRelationships || this.usesRelationships == 'undefined';
	pathsRestored = false;

	get dbType(): string { return dbDispatch.db.dbType; }
	key_write(key: string, value: any) { localStorage[key] = JSON.stringify(value); }
	dbKey_write(key: string, value: any) { this.key_write(key + this.dbType, value); }
	dbKey_read(key: string) { return this.key_read(key + this.dbType); }
	dbKey_get(key: string) { return this.key_get(key + this.dbType); }

	key_read(key: string): any | null {
		const storedValue = localStorage[key];
		if (!storedValue || storedValue == 'undefined') {
			return null;
		} else {
			return JSON.parse(storedValue);
		} 
	}

	key_get(key: string): Array<Path> {
		const h = g.hierarchy;
		let paths = this.ignorePaths ? [] : this.key_read(key)?.map((e: string) => h.path_remember_unique(e)) ?? [];
		let index = paths.length - 1;
		while (index >= 0) {
			const path = paths[index];
			if (path) {
				for (const id of path.ids) {
					const relationship = h.relationship_get_forHID(id.hash());
					if (!relationship) {
						paths.slice(1, index);
					}
				}
			}
			index--;
		};
		return paths;
	}

	restore() {
		// localStorage.clear();
		// const isLocal = u.isServerLocal;
		// this.key_write(IDPersistant.row_height, 20);
		// this.key_write(IDPersistant.dot_size, 13);

		if (this.ignorePaths) {
			this.key_write(IDPersistant.relationships, true);
		}
		this.key_write(IDPersistant.title_atTop, false);
		k.showControls = this.key_read(IDPersistant.controls) ?? false;
		k.titleIsAtTop = this.key_read(IDPersistant.title_atTop) ?? false;
		g.applyScale(!u.device_isMobile ? 1 : this.key_read(IDPersistant.scale) ?? 1);

		s_show_details.set(this.key_read(IDPersistant.details) ?? false);
		s_layout_byClusters.set(this.key_read(IDPersistant.layout) ?? false);
		s_thing_fontFamily.set(this.key_read(IDPersistant.font) ?? 'Arial');
		s_show_child_graph.set(this.key_read(IDPersistant.show_children) ?? true);
		s_user_graphOffset.set(this.key_read(IDPersistant.origin) ?? new Point());

		s_show_details.subscribe((flag: boolean) => {
			this.key_write(IDPersistant.details, flag);
			g.graphRect_update();
			signals.signal_relayoutWidgets_fromHere();
		});
		s_show_child_graph.subscribe((flag: boolean) => {
			this.key_write(IDPersistant.show_children, flag);
		})
		s_layout_byClusters.subscribe((flag: boolean) => {
			this.key_write(IDPersistant.layout, flag);
		})
	}

	paths_restore(force: boolean = false) {
		if (!this.pathsRestored || force) {
			this.pathsRestored = true;
			this.here_restore();
			s_paths_grabbed.set(this.dbKey_get(IDPersistant.grabbed));
			s_paths_expanded.set(this.dbKey_get(IDPersistant.expanded));
	
			s_paths_grabbed.subscribe((paths: Array<Path>) => {
				this.dbKey_write(IDPersistant.grabbed, !paths ? null : paths.map(p => p.pathString));
			});
	
			s_paths_expanded.subscribe((paths: Array<Path>) => {
				this.dbKey_write(IDPersistant.expanded, !paths ? null : paths.map(p => p.pathString));
			});
		}
	}

	here_restore() {
		const h = g.hierarchy;
		g.rootPath = h.path_remember_unique();
		let pathToHere = g.rootPath;
		if (!this.ignorePaths) {
			const herePathString = this.dbKey_read(IDPersistant.here);
			if (herePathString) {
				const herePath = h.path_remember_unique(herePathString);
				if (herePath) {
					pathToHere = herePath;
				}
			}
		}
		let here = h.thing_get_forPath(pathToHere);
		if (here == null) {
			const lastGrabbedPath = h.grabs.path_lastGrabbed?.pathFrom;
			if (lastGrabbedPath) {
				pathToHere = lastGrabbedPath;
			}
		}
		pathToHere.becomeHere();
		s_path_here.subscribe((path: Path) => {
			this.dbKey_write(IDPersistant.here, !path ? null : path.pathString);
		});
	}

	key_apply(key: string, matching: string, apply: (flag: boolean) => void, persist: boolean = true) {
		const queryStrings = k.queryString;
        const value = queryStrings.get(key);
		if (value) {
			const flag = (value === matching);
			apply(flag);
			if (persist) {
				this.key_write(key, flag);
			}
		}
	}

	queryStrings_apply() {
		const queryStrings = k.queryString;
        const erase = queryStrings.get('erase');
        const titleFlag = queryStrings.get('locate')?.split(k.comma).includes('titleAtTop') ?? false;
		this.key_apply(IDPersistant.layout, 'clusters', (flag) => s_layout_byClusters.set(flag));
		this.key_apply(IDPersistant.details, 'hide', (flag) => s_show_details.set(!flag), false);
		this.key_apply(IDPersistant.controls, 'show', (flag) => k.showControls = flag);
		this.key_write(IDPersistant.title_atTop, titleFlag);
		k.titleIsAtTop = titleFlag;
        if (erase) {
            for (const option of erase.split(k.comma)) {
                switch (option) {
                    case 'data':
						dbDispatch.eraseDB = true;
						break;
                    case 'settings': 
						localStorage.clear();
						s_paths_expanded.set([]);
						s_path_here.set(g.rootPath);
						s_paths_grabbed.set([g.rootPath]);
						break;
                }
            }
        }
    }
}

export const persistLocal = new PersistLocal();
