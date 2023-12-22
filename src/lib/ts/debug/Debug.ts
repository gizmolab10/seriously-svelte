export enum DebugFlag {
	remote = 'remote',  // interactions with remote
	things = 'things',  // enable Things.debugLog
	colors = 'colors',  // indicate some coordinates
	graph  = 'graph',   // log size of graph area
	order  = 'order',   // observe relocating
	error  = 'error',   // async errors
	lines  = 'lines',   // alignment dots for lines and widgets
}

export class Debug {
	flags: DebugFlag[];
	constructor(flags: DebugFlag[]) { this.flags = flags; }
	hasOption(option: DebugFlag) { return this.flags.includes(option); }
	log_error(message: string) { this.log_maybe(DebugFlag.error, message) }
	log_remote(message: string) { this.log_maybe(DebugFlag.remote, message) }
	log_maybe(option: DebugFlag, message: string) { if (this.hasOption(option)) { console.log(message); }}
	log_target(target: any, key: string) { console.log(`Method \'${key}\' is called on class \'${target.constructor.name}\'`); }
	get colors(): boolean { return this.hasOption(DebugFlag.colors); }
	get lines(): boolean { return this.hasOption(DebugFlag.lines); }
	get react(): boolean { return this.hasOption(DebugFlag.react); }

	applyQueryStrings(queryStrings: URLSearchParams) {
		const debug = queryStrings.get('debug');
		if (debug) {
			const flags = debug.split(',');
			for (const option of flags) {
				switch (option) {
					case 'remote': this.flags.push(DebugFlag.remote); break;
					case 'things': this.flags.push(DebugFlag.things); break;
					case 'colors': this.flags.push(DebugFlag.colors); break;
					case 'graph': this.flags.push(DebugFlag.graph); break;
					case 'order': this.flags.push(DebugFlag.order); break;
					case 'error': this.flags.push(DebugFlag.error); break;
					case 'lines': this.flags.push(DebugFlag.lines); break;
					case 'react': this.flags.push(DebugFlag.react); break;
				}
			}
		}
	}
}

export const debug = new Debug([]);
