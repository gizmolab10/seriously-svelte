import { k, Thing } from './GlobalImports';

export default class Path {
	path: string;

	constructor(path: string) {
		this.path = path;
	}

	stripPath(by: number) { return !this.path ? null : this.path.split(k.pathSeparator).slice(0, -by).join(k.pathSeparator); }
	lastIDOf(by: number = -1): string { return this.path.split(k.pathSeparator).slice(by)[0]; }

	appendPath(thing: Thing): string | null {
		const elements = this.path.split(k.pathSeparator);
		elements.push(thing.id);
		return elements.join(k.pathSeparator);
	}
}