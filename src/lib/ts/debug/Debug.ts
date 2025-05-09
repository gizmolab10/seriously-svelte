import { c } from '../managers/Configuration';

// query string: ?debug=p,action

export enum E_Debug {
	bidirectionals	= 'bidirectionals',
	preferences		= 'preferences',
	hide_rings		= 'hide_rings',
	reposition		= 'reposition',
	fast_load		= 'fast_load',
	segments		= 'segments',
	reticle			= 'reticle',	// debug radial layout geometry
	layout 			= 'layout',
	action  		= 'action',
	colors			= 'colors',		// indicate some coordinates
	cursor			= 'cursor',
	crumbs  		= 'crumbs',
	expand  		= 'expand',
	handle			= 'handle',
	radial			= 'radial',
	remote			= 'remote',		// interactions with remote
	signal			= 'signal	',
	things			= 'things',		// enable Things.debugLog
	build			= 'build',
	error			= 'error',		// async errors
	graph			= 'graph',		// log size of graph area
	lines			= 'lines',		// alignment dots for lines and widgets
	mouse			= 'mouse',
	hover			= 'hover',
	order			= 'order',		// observe relocating
	trace			= 'trace',
	tools			= 'tools',		// state logic of add parent tool
	edit			= 'edit',		// state machine for editing
	grab			= 'grab',
	info			= 'info',
	move			= 'move',
	key				= 'key',		// keyboard input
}

export class Debug {
	flags: Array<E_Debug>;
	constructor(flags: Array<E_Debug>) { this.flags = flags; }
	hasOption(option: E_Debug) { return this.flags.includes(option); }
	captureStackTrace(): string | undefined { return new Error().stack; }

	get info(): boolean { return this.hasOption(E_Debug.info); }
	get graph(): boolean { return this.hasOption(E_Debug.graph); }
	get lines(): boolean { return this.hasOption(E_Debug.lines); }
	get tools(): boolean { return this.hasOption(E_Debug.tools); }
	get trace(): boolean { return this.hasOption(E_Debug.trace); }
	get cursor(): boolean { return this.hasOption(E_Debug.cursor); }
	get radial(): boolean { return this.hasOption(E_Debug.radial); }
	get reticle(): boolean { return this.hasOption(E_Debug.reticle); }
	get fast_load(): boolean { return this.hasOption(E_Debug.fast_load); }
	get hide_rings(): boolean { return this.hasOption(E_Debug.hide_rings); }

	log_key(message: string) { this.log_maybe(E_Debug.key, message); }
	log_edit(message: string) { this.log_maybe(E_Debug.edit, message); }
	log_grab(message: string) { this.log_maybe(E_Debug.grab, message); }
	log_info(message: string) { this.log_maybe(E_Debug.info, message); }
	log_move(message: string) { this.log_maybe(E_Debug.move, message); }
	log_build(message: string) { this.log_maybe(E_Debug.build, message); }
	log_error(message: string) { this.log_maybe(E_Debug.error, message); }
	log_hover(message: string) { this.log_maybe(E_Debug.hover, message); }
	log_lines(message: string) { this.log_maybe(E_Debug.lines, message); }
	log_mouse(message: string) { this.log_maybe(E_Debug.mouse, message); }
	log_tools(message: string) { this.log_maybe(E_Debug.tools, message); }
	log_action(message: string) { this.log_maybe(E_Debug.action, message); }
	log_colors(message: string) { this.log_maybe(E_Debug.colors, message); }
	log_crumbs(message: string) { this.log_maybe(E_Debug.crumbs, message); }
	log_cursor(message: string) { this.log_maybe(E_Debug.cursor, message); }
	log_expand(message: string) { this.log_maybe(E_Debug.expand, message); }
	log_handle(message: string) { this.log_maybe(E_Debug.handle, message); }
	log_layout(message: string) { this.log_maybe(E_Debug.layout, message); }
	log_radial(message: string) { this.log_maybe(E_Debug.radial, message); }
	log_remote(message: string) { this.log_maybe(E_Debug.remote, message); }
	log_signal(message: string) { this.log_maybe(E_Debug.signal, message); }
	log_things(message: string) { this.log_maybe(E_Debug.things, message); }
	log_segments(message: string) { this.log_maybe(E_Debug.segments, message); }
	log_reposition(message: string) { this.log_maybe(E_Debug.reposition, message); }
	log_preferences(message: string) { this.log_maybe(E_Debug.preferences, message); }
	log_bidirectionals(message: string) { this.log_maybe(E_Debug.bidirectionals, message); }
	
	log_maybe(option: E_Debug, message: string) {
		if (this.hasOption(option)) {
			let log = message;
			if (this.trace) {
				log = `\n${log}\n${this.captureStackTrace()}`;
			}
			console.log(option.toUpperCase(), log);
		}
	}

	queryStrings_apply() {
		const debug = c.queryStrings.get('debug');
		if (debug) {
			const flags = debug.split(',');
			for (const option of flags) {
				switch (option) {
					case 'bidirectionals': this.flags.push(E_Debug.bidirectionals); break;
					case 'preferences': this.flags.push(E_Debug.preferences); break;
					case 'hide_rings': this.flags.push(E_Debug.hide_rings); break;
					case 'reposition': this.flags.push(E_Debug.reposition); break;
					case 'segments': this.flags.push(E_Debug.segments); break;
					case 'reticle': this.flags.push(E_Debug.reticle); break;
					case 'action': this.flags.push(E_Debug.action); break;
					case 'colors': this.flags.push(E_Debug.colors); break;
					case 'crumbs': this.flags.push(E_Debug.crumbs); break;
					case 'cursor': this.flags.push(E_Debug.cursor); break;
					case 'expand': this.flags.push(E_Debug.expand); break;
					case 'handle': this.flags.push(E_Debug.handle); break;
					case 'layout': this.flags.push(E_Debug.layout); break;
					case 'radial': this.flags.push(E_Debug.radial); break;
					case 'remote': this.flags.push(E_Debug.remote); break;
					case 'signal': this.flags.push(E_Debug.signal); break;
					case 'things': this.flags.push(E_Debug.things); break;
					case 'build': this.flags.push(E_Debug.build); break;
					case 'error': this.flags.push(E_Debug.error); break;
					case 'graph': this.flags.push(E_Debug.graph); break;
					case 'hover': this.flags.push(E_Debug.hover); break;
					case 'lines': this.flags.push(E_Debug.lines); break;
					case 'mouse': this.flags.push(E_Debug.mouse); break;
					case 'order': this.flags.push(E_Debug.order); break;
					case 'tools': this.flags.push(E_Debug.tools); break;
					case 'trace': this.flags.push(E_Debug.trace); break;
					case 'edit': this.flags.push(E_Debug.edit); break;
					case 'grab': this.flags.push(E_Debug.grab); break;
					case 'info': this.flags.push(E_Debug.info); break;
					case 'move': this.flags.push(E_Debug.move); break;
					case 'key': this.flags.push(E_Debug.key); break;
				}
			}
		}
	}
}

export const debug   = new Debug([]);
