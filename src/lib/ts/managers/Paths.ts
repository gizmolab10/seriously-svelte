import { Path } from "../common/GlobalImports";

export default class Paths {
	paths_byPathString: { [pathString: string]: Path } = {};

	add(path: Path) { this.paths_byPathString[path.pathString] = path; }
	find(pathString: string) { return this.paths_byPathString[pathString]; }
	uniquePath(pathString: string = '') {
		let path = this.find(pathString)
		if (!path) {
			path = new Path(pathString);
			this.add(path);
		}
		return path;
	}
}

export const paths = new Paths();
