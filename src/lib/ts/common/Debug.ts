export enum DebugOption {
	remote = 'remote',
	debug  = 'debug',
	order  = 'order',
	error  = 'error',
}

const options: DebugOption[] = [
    DebugOption.remote,
    DebugOption.debug,
    // DebugOption.order,
];

export class Debug {
    options: DebugOption[];
    constructor(options: DebugOption[]) { this.options = options; }
    hasOption(option: DebugOption) { return this.options.includes(option); }
    log(option: DebugOption, message: string) { if (this.hasOption(option)) { console.log(message); }}
    tLog(target: any, key: string) { console.log(`Method \'${key}\' is called on class \'${target.constructor.name}\'`); }
}

export const debug = new Debug(options);