export enum ReactFlag {
	mount	= 'mount',
	layout	= 'layout',
	origins = 'origins',
	rebuild = 'rebuild',
}
export class DebugReact {
	flags: Array<ReactFlag>;
	constructor(flags: Array<ReactFlag>) { this.flags = flags; }
	hasOption(option: ReactFlag) { return this.flags.includes(option); }
	log_layout(message: string) { this.log_maybe(ReactFlag.layout, message) }
	log_origins(message: string) { this.log_maybe(ReactFlag.origins, message) }
	log_rebuild(message: string) { this.log_maybe(ReactFlag.rebuild, message) }
	log_mount(message: string) { this.log_maybe(ReactFlag.mount, message) }
	log_maybe(option: ReactFlag, message: string) { if (this.hasOption(option)) { console.log(option + k.space + message); }}
	get layout(): boolean { return this.hasOption(ReactFlag.layout); }
	get mount(): boolean { return this.hasOption(ReactFlag.mount); }

	applyQueryStrings(queryStrings: URLSearchParams) {
		const debug = queryStrings.get('react');
		if (debug) {
			const flags = debug.split(k.comma);
			for (const option of flags) {
				switch (option) {
					case 'mount': this.flags.push(ReactFlag.mount); break;
					case 'layout': this.flags.push(ReactFlag.layout); break;
					case 'origins': this.flags.push(ReactFlag.origins); break;
					case 'rebuild': this.flags.push(ReactFlag.rebuild); break;
				}
			}
		}
	}
}

export const debugReact = new DebugReact([]);
