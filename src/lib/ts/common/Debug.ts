export enum DebugOption {
	remote = 'remote',
	things = 'things',
	colors = 'colors',
	graph  = 'graph',
	order  = 'order',
	error  = 'error',
	lines  = 'lines',
}

const options: DebugOption[] = [];

export class Debug {
    options: DebugOption[];
    constructor(options: DebugOption[]) { this.options = options; }
    hasOption(option: DebugOption) { return this.options.includes(option); }
    log(option: DebugOption, message: string) { if (this.hasOption(option)) { console.log(message); }}
    tLog(target: any, key: string) { console.log(`Method \'${key}\' is called on class \'${target.constructor.name}\'`); }
    get colors(): boolean { return this.hasOption(DebugOption.colors); }
    get lines(): boolean { return this.hasOption(DebugOption.lines); }

	applyQueryStrings(queryStrings: URLSearchParams) {
        const debug = queryStrings.get('debug');
        if (debug) {
            const options = debug.split(',');
            for (const option of options) {
                switch (option) {
                    case 'remote': this.options.push(DebugOption.remote); break;
                    case 'things': this.options.push(DebugOption.things); break;
                    case 'colors': this.options.push(DebugOption.colors); break;
                    case 'graph': this.options.push(DebugOption.graph); break;
                    case 'order': this.options.push(DebugOption.order); break;
                    case 'error': this.options.push(DebugOption.error); break;
                    case 'lines': this.options.push(DebugOption.lines); break;
                }
            }
        }
    }
}

export const debug = new Debug(options);
