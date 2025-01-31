import { g } from '../state/S_Global';

// query string: ?debug=preferences,action

export enum T_Debug {
	preferences	= 'preferences',
	hide_rings	= 'hide_rings',
	fast_load	= 'fast_load',
	segments	= 'segments',
	origins 	= 'origins',
	rebuild 	= 'rebuild',
	reticle		= 'reticle',	// debug radial layout geometry
	action  	= 'action',
	colors		= 'colors',		// indicate some coordinates
	cursor		= 'cursor',
	crumbs  	= 'crumbs',
	layout		= 'layout',
	radial		= 'radial',
	remote		= 'remote',		// interactions with remote
	things		= 'things',		// enable Things.debugLog
	signal		= 'signal',
	build		= 'build',
	error		= 'error',		// async errors
	grabs		= 'grabs',
	graph		= 'graph',		// log size of graph area
	lines		= 'lines',		// alignment dots for lines and widgets
	mount		= 'mount',
	mouse		= 'mouse',
	hover		= 'hover',
	order		= 'order',		// observe relocating
	tools		= 'tools',		// state logic of add parent tool
	dots		= 'dots',
	edit		= 'edit',		// state machine for editing
	info		= 'info',
	key			= 'key',		// keyboard input
}

export class Debug {
	flags: Array<T_Debug>;
	constructor(flags: Array<T_Debug>) { this.flags = flags; }
	hasOption(option: T_Debug) { return this.flags.includes(option); }

	get info(): boolean { return this.hasOption(T_Debug.info); }
	get graph(): boolean { return this.hasOption(T_Debug.graph); }
	get lines(): boolean { return this.hasOption(T_Debug.lines); }
	get tools(): boolean { return this.hasOption(T_Debug.tools); }
	get cursor(): boolean { return this.hasOption(T_Debug.cursor); }
	get radial(): boolean { return this.hasOption(T_Debug.radial); }
	get reticle(): boolean { return this.hasOption(T_Debug.reticle); }
	get fast_load(): boolean { return this.hasOption(T_Debug.fast_load); }
	get hide_rings(): boolean { return this.hasOption(T_Debug.hide_rings); }

	log_key(message: string) { this.log_maybe(T_Debug.key, message); }
	log_dots(message: string) { this.log_maybe(T_Debug.dots, message); }
	log_edit(message: string) { this.log_maybe(T_Debug.edit, message); }
	log_info(message: string) { this.log_maybe(T_Debug.info, message); }
	log_build(message: string) { this.log_maybe(T_Debug.build, message); }
	log_error(message: string) { this.log_maybe(T_Debug.error, message); }
	log_grabs(message: string) { this.log_maybe(T_Debug.grabs, message); }
	log_hover(message: string) { this.log_maybe(T_Debug.hover, message); }
	log_mount(message: string) { this.log_maybe(T_Debug.mount, message); }
	log_mouse(message: string) { this.log_maybe(T_Debug.mouse, message); }
	log_tools(message: string) { this.log_maybe(T_Debug.tools, message); }
	log_action(message: string) { this.log_maybe(T_Debug.action, message); }
	log_crumbs(message: string) { this.log_maybe(T_Debug.crumbs, message); }
	log_cursor(message: string) { this.log_maybe(T_Debug.cursor, message); }
	log_layout(message: string) { this.log_maybe(T_Debug.layout, message); }
	log_radial(message: string) { this.log_maybe(T_Debug.radial, message); }
	log_remote(message: string) { this.log_maybe(T_Debug.remote, message); }
	log_signal(message: string) { this.log_maybe(T_Debug.signal, message); }
	log_origins(message: string) { this.log_maybe(T_Debug.origins, message); }
	log_rebuild(message: string) { this.log_maybe(T_Debug.rebuild, message); }
	log_segments(message: string) { this.log_maybe(T_Debug.segments, message); }
	log_preferences(message: string) { this.log_maybe(T_Debug.preferences, message); }
	
	log_maybe(option: T_Debug, message: string) {
		if (this.hasOption(option)) {
			console.log(option.toUpperCase(), message);
		}
	}

	queryStrings_apply() {
		const debug = g.queryStrings.get('debug');
		if (debug) {
			const flags = debug.split(',');
			for (const option of flags) {
				switch (option) {
					case 'preferences': this.flags.push(T_Debug.preferences); break;
					case 'hide_rings': this.flags.push(T_Debug.hide_rings); break;
					case 'segments': this.flags.push(T_Debug.segments); break;
					case 'origins': this.flags.push(T_Debug.origins); break;
					case 'rebuild': this.flags.push(T_Debug.rebuild); break;
					case 'reticle': this.flags.push(T_Debug.reticle); break;
					case 'action': this.flags.push(T_Debug.action); break;
					case 'colors': this.flags.push(T_Debug.colors); break;
					case 'crumbs': this.flags.push(T_Debug.crumbs); break;
					case 'cursor': this.flags.push(T_Debug.cursor); break;
					case 'layout': this.flags.push(T_Debug.layout); break;
					case 'radial': this.flags.push(T_Debug.radial); break;
					case 'remote': this.flags.push(T_Debug.remote); break;
					case 'signal': this.flags.push(T_Debug.signal); break;
					case 'things': this.flags.push(T_Debug.things); break;
					case 'build': this.flags.push(T_Debug.build); break;
					case 'error': this.flags.push(T_Debug.error); break;
					case 'grabs': this.flags.push(T_Debug.grabs); break;
					case 'graph': this.flags.push(T_Debug.graph); break;
					case 'hover': this.flags.push(T_Debug.hover); break;
					case 'lines': this.flags.push(T_Debug.lines); break;
					case 'mount': this.flags.push(T_Debug.mount); break;
					case 'mouse': this.flags.push(T_Debug.mouse); break;
					case 'order': this.flags.push(T_Debug.order); break;
					case 'tools': this.flags.push(T_Debug.tools); break;
					case 'dots': this.flags.push(T_Debug.dots); break;
					case 'edit': this.flags.push(T_Debug.edit); break;
					case 'info': this.flags.push(T_Debug.info); break;
					case 'key': this.flags.push(T_Debug.key); break;
				}
			}
		}
	}
}

export const debug   = new Debug([]);
