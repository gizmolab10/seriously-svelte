import { k } from '../../ts/common/Constants';

export enum ReactKind {
	mount	= 'mount',
	layout	= 'layout',
	origins = 'origins',
	rebuild = 'rebuild',
}

export class DebugReact {
	kinds: Array<ReactKind>;
	get mount(): boolean { return this.hasKind(ReactKind.mount); }
	get layout(): boolean { return this.hasKind(ReactKind.layout); }
	constructor(kinds: Array<ReactKind>) { this.kinds = kinds; }
	hasKind(kind: ReactKind) { return this.kinds.includes(kind); }
	log_mount(message: string) { this.log_maybe(ReactKind.mount, message) }
	log_layout(message: string) { this.log_maybe(ReactKind.layout, message) }
	log_origins(message: string) { this.log_maybe(ReactKind.origins, message) }
	log_rebuild(message: string) { this.log_maybe(ReactKind.rebuild, message) }
	log_maybe(kind: ReactKind, message: string) { if (this.hasKind(kind)) { console.log(kind + ' ' + message); }}

	queryStrings_apply() {
		const queryStrings = k.queryStrings;
		const debug = queryStrings.get('react');
		if (debug) {
			const kinds = debug.split(',');
			for (const kind of kinds) {
				switch (kind) {
					case 'mount': this.kinds.push(ReactKind.mount); break;
					case 'layout': this.kinds.push(ReactKind.layout); break;
					case 'origins': this.kinds.push(ReactKind.origins); break;
					case 'rebuild': this.kinds.push(ReactKind.rebuild); break;
				}
			}
		}
	}
}

export const debugReact = new DebugReact([]);
