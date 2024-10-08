import { g } from '../../ts/state/Global_State';

// query string: ?debug=reticule,tools

export enum DebugFlag {
	hide_rings = 'hide_rings',
	reticule   = 'reticule',	// debug ring layout geometry
	persist	   = 'persist',
	origins    = 'origins',
	rebuild    = 'rebuild',
	layout	   = 'layout',
	action     = 'action',
	remote	   = 'remote',		// interactions with remote
	things	   = 'things',		// enable Things.debugLog
	colors	   = 'colors',		// indicate some coordinates
	graph	   = 'graph',		// log size of graph area
	order	   = 'order',		// observe relocating
	error	   = 'error',		// async errors
	lines	   = 'lines',		// alignment dots for lines and widgets
	tools	   = 'tools',		// state logic of add parent tool
	build	   = 'build',
	mount	   = 'mount',
	edit	   = 'edit',		// editing state machine
	beat	   = 'beat',		// heartbeat
	key		   = 'key',			// keyboard input
}

export class Debug {
	flags: Array<DebugFlag>;
	constructor(flags: Array<DebugFlag>) { this.flags   = flags; }
	hasOption(option: DebugFlag) { return this.flags.includes(option); }
	log_key(message: string) { this.log_maybe(DebugFlag.key, message); }
	log_beat(message: string) { this.log_maybe(DebugFlag.beat, message); }
	log_edit(message: string) { this.log_maybe(DebugFlag.edit, message); }
	log_error(message: string) { this.log_maybe(DebugFlag.error, message) }
	log_tools(message: string) { this.log_maybe(DebugFlag.tools, message) }
	log_build(message: string) { this.log_maybe(DebugFlag.build, message) }
	log_mount(message: string) { this.log_maybe(DebugFlag.mount, message) }
	log_remote(message: string) { this.log_maybe(DebugFlag.remote, message) }
	log_action(message: string) { this.log_maybe(DebugFlag.action, message) }
	log_layout(message: string) { this.log_maybe(DebugFlag.layout, message) }
	log_origins(message: string) { this.log_maybe(DebugFlag.origins, message) }
	log_rebuild(message: string) { this.log_maybe(DebugFlag.rebuild, message) }
	log_persist(message: string) { this.log_maybe(DebugFlag.persist, message) }
	log_maybe(option: DebugFlag, message: string) { if (this.hasOption(option)) { console.log(option.toUpperCase(), message); }}
	log_target(target: any, key: string) { console.log(`Method \'${key}\' is called on class \'${target.constructor.name}\'`); }
	get hide_rings(): boolean { return this.hasOption(DebugFlag.hide_rings); }
	get reticule(): boolean { return this.hasOption(DebugFlag.reticule); }
	get lines(): boolean { return this.hasOption(DebugFlag.lines); }

	queryStrings_apply() {
		const debug = g.queryStrings.get('debug');
		if (debug) {
			const flags = debug.split(',');
			for (const option of flags) {
				switch (option) {
					case 'hide_rings': this.flags.push(DebugFlag.hide_rings); break;
					case 'reticule': this.flags.push(DebugFlag.reticule); break;
					case 'origins': this.flags.push(DebugFlag.origins); break;
					case 'persist': this.flags.push(DebugFlag.persist); break;
					case 'rebuild': this.flags.push(DebugFlag.rebuild); break;
					case 'remote': this.flags.push(DebugFlag.remote); break;
					case 'things': this.flags.push(DebugFlag.things); break;
					case 'colors': this.flags.push(DebugFlag.colors); break;
					case 'action': this.flags.push(DebugFlag.action); break;
					case 'layout': this.flags.push(DebugFlag.layout); break;
					case 'build': this.flags.push(DebugFlag.build); break;
					case 'mount': this.flags.push(DebugFlag.mount); break;
					case 'graph': this.flags.push(DebugFlag.graph); break;
					case 'order': this.flags.push(DebugFlag.order); break;
					case 'error': this.flags.push(DebugFlag.error); break;
					case 'lines': this.flags.push(DebugFlag.lines); break;
					case 'tools': this.flags.push(DebugFlag.tools); break;
					case 'edit': this.flags.push(DebugFlag.edit); break;
					case 'beat': this.flags.push(DebugFlag.beat); break;
					case 'key': this.flags.push(DebugFlag.key); break;
				}
			}
		}
	}
}

export const debug   = new Debug([]);
