import { g, k, u, Path, Point, signals, dbDispatch, GraphRelations } from '../common/GlobalImports'
import { s_path_focus, s_show_details, s_user_graphOffset } from '../state/State';
import { s_thing_fontFamily, s_graph_relations } from '../state/State';
import { s_cluster_angle, s_layout_asClusters } from '../state/State';
import { s_paths_grabbed, s_paths_expanded } from '../state/State';

export enum IDPersistant {
	relationships = 'relationships',
	show_children = 'show_children',
	title_atTop   = 'title_atTop',
	relations	  = 'relations',
	expanded	  = 'expanded',
	controls	  = 'controls',
	grabbed		  = 'grabbed',
	details		  = 'details',
	cluster		  = 'cluster',
	layout		  = 'layout',
	origin		  = 'origin',
	scale		  = 'scale',
	focus		  = 'focus',
	font		  = 'font',
	db			  = 'db',
}

class PersistLocal {
	// for backwards compatibility with {focus, grabbed, expanded} which were stored as relationship ids (not as path strings)
	usesRelationships = localStorage[IDPersistant.relationships];
	ignorePaths = !this.usesRelationships || this.usesRelationships == 'undefined';
	pathsRestored = false;

	queryStrings_apply() {
		const queryStrings = k.queryString;
        const erase = queryStrings.get('erase');
        const titleFlag = queryStrings.get('locate')?.split(k.comma).includes('titleAtTop') ?? false;
		this.key_apply(IDPersistant.layout, 'clusters', (flag) => s_layout_asClusters.set(flag));
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
						s_path_focus.set(g.rootPath);
						s_paths_grabbed.set([g.rootPath]);
						break;
                }
            }
        }
    }

	get dbType(): string { return dbDispatch.db.dbType; }
	key_write(key: string, value: any) { localStorage[key] = JSON.stringify(value); }
	dbKey_paths(key: string): Array<Path> { return this.key_paths(key + this.dbType); }
	dbKey_write(key: string, value: any) { this.key_write(key + this.dbType, value); }
	dbKey_read(key: string): any | null { return this.key_read(key + this.dbType); }

	key_read(key: string): any | null {
		const storedValue = localStorage[key];
		if (!storedValue || storedValue == 'undefined') {
			return null;
		} else {
			return JSON.parse(storedValue);
		} 
	}

	key_paths(key: string): Array<Path> {
		const h = g.hierarchy;
		const pathStrings = this.key_read(key);
		const length = pathStrings.length;
		if (this.ignorePaths || !pathStrings || length == 0) {
			return [];
		}
		let needsRewrite = false;
		const paths: Array<Path> = [];
		const reversed = pathStrings.reverse();
		reversed.forEach((pathString: string, index: number) => {
			const path = h.path_remember_createUnique(pathString);
			if (!path) {
				pathStrings.slice(1, length - index);
				needsRewrite = true;
			} else {
				for (const id of path.ids) {
					const relationship = h.relationship_forHID(id.hash());
					if (!relationship) {
						pathStrings.slice(1, length - index);
						needsRewrite = true;
						break;
					}
				}
			}
			if (!needsRewrite && path) {
				paths.push(path);
			}
		});
		if (needsRewrite) {
			this.key_write(key, pathStrings);
		}
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

		s_cluster_angle.set( Math.PI * -0.28);
		s_show_details.set(this.key_read(IDPersistant.details) ?? false);
		s_thing_fontFamily.set(this.key_read(IDPersistant.font) ?? 'Arial');
		s_layout_asClusters.set(this.key_read(IDPersistant.layout) ?? false);
		s_user_graphOffset.set(this.key_read(IDPersistant.origin) ?? new Point());
		s_graph_relations.set(this.key_read(IDPersistant.relations) ?? GraphRelations.children);

		s_show_details.subscribe((flag: boolean) => {
			this.key_write(IDPersistant.details, flag);
			g.graphRect_update();
			signals.signal_relayoutWidgets_fromFocus();
		});
		s_graph_relations.subscribe((relations: string) => {
			this.key_write(IDPersistant.relations, relations);
		})
		s_layout_asClusters.subscribe((flag: boolean) => {
			this.key_write(IDPersistant.layout, flag);
		})
	}

	paths_restore(force: boolean = false) {
		if (!this.pathsRestored || force) {
			this.pathsRestored = true;
			this.focus_restore();
			s_paths_grabbed.set(this.dbKey_paths(IDPersistant.grabbed));
			s_paths_expanded.set(this.dbKey_paths(IDPersistant.expanded));
	
			s_paths_grabbed.subscribe((paths: Array<Path>) => {
				this.dbKey_write(IDPersistant.grabbed, !paths ? null : paths.map(p => p.pathString));
			});
	
			s_paths_expanded.subscribe((paths: Array<Path>) => {
				this.dbKey_write(IDPersistant.expanded, !paths ? null : paths.map(p => p.pathString));
			});
		}
	}

	focus_restore() {
		const h = g.hierarchy;
		g.rootPath_set(h.path_remember_createUnique());
		let pathToFocus = g.rootPath;
		if (!this.ignorePaths) {
			const focusPathString = this.dbKey_read(IDPersistant.focus);
			if (focusPathString) {
				const focusPath = h.path_remember_createUnique(focusPathString);
				if (focusPath) {
					pathToFocus = focusPath;
				}
			}
		}
		let focus = h.thing_forPath(pathToFocus);
		if (focus == null) {
			const lastGrabbedPath = h.grabs.path_lastGrabbed?.parentPath;
			if (lastGrabbedPath) {
				pathToFocus = lastGrabbedPath;
			}
		}
		pathToFocus.becomeFocus();
		s_path_focus.subscribe((path: Path) => {
			this.dbKey_write(IDPersistant.focus, !path ? null : path.pathString);
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

}

export const persistLocal = new PersistLocal();
