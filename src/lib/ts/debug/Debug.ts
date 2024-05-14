import { k } from '../../ts/common/Constants';

export enum DebugFlag {
	remote = 'remote',  // interactions with remote
	things = 'things',  // enable Things.debugLog
	colors = 'colors',  // indicate some coordinates
	graph  = 'graph',   // log size of graph area
	order  = 'order',   // observe relocating
	error  = 'error',   // async errors
	lines  = 'lines',   // alignment dots for lines and widgets
	edit   = 'edit',	// editing state machine
	beat   = 'beat',	// heartbeat
}

export class Debug {
	flags: Array<DebugFlag>;
	constructor(flags: Array<DebugFlag>) { this.flags = flags; }
	hasOption(option: DebugFlag) { return this.flags.includes(option); }
	log_beat(message: string) { this.log_maybe(DebugFlag.beat, message); }
	log_edit(message: string) { this.log_maybe(DebugFlag.edit, message); }
	log_error(message: string) { this.log_maybe(DebugFlag.error, message) }
	log_remote(message: string) { this.log_maybe(DebugFlag.remote, message) }
	log_maybe(option: DebugFlag, message: string) { if (this.hasOption(option)) { console.log(option.toUpperCase(), message); }}
	log_target(target: any, key: string) { console.log(`Method \'${key}\' is called on class \'${target.constructor.name}\'`); }
	get colors(): boolean { return this.hasOption(DebugFlag.colors); }
	get lines(): boolean { return this.hasOption(DebugFlag.lines); }

	queryStrings_apply() {
		const queryStrings = k.queryString;
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
					case 'beat': this.flags.push(DebugFlag.beat); break;
					case 'edit': this.flags.push(DebugFlag.edit); break;
				}
			}
		}
	}
}

export const debug = new Debug([]);
