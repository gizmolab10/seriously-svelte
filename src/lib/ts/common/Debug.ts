export enum DebugOption {
	remote = 'remote',
	things = 'things',
	colors = 'colors',
	graph  = 'graph',
	order  = 'order',
	error  = 'error',
}

const options: DebugOption[] = [
    // DebugOption.remote,
    // DebugOption.things,
    // DebugOption.order,
    // DebugOption.error,
];

export class Debug {
    options: DebugOption[];
    constructor(options: DebugOption[]) { this.options = options; }
    hasOption(option: DebugOption) { return this.options.includes(option); }
    log(option: DebugOption, message: string) { if (this.hasOption(option)) { console.log(message); }}
    tLog(target: any, key: string) { console.log(`Method \'${key}\' is called on class \'${target.constructor.name}\'`); }

	applyQueryStrings(queryStrings: URLSearchParams) {
		if (queryStrings.get('remote') === 'debug') {
            this.options.push(DebugOption.remote);
        }
        if (queryStrings.get('things') === 'debug') {
            this.options.push(DebugOption.things);
        }
		if (queryStrings.get('colors') === 'debug') {
            this.options.push(DebugOption.colors);
        }
		if (queryStrings.get('graph') === 'debug') {
            this.options.push(DebugOption.graph);
        }
		if (queryStrings.get('order') === 'debug') {
            this.options.push(DebugOption.order);
        }
		if (queryStrings.get('error') === 'debug') {
            this.options.push(DebugOption.error);
        }
    }
}

export const debug = new Debug(options);
