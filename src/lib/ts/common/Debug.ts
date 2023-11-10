export enum DebuggingOptions {
	remote = 'remote',
	order  = 'order',
	error  = 'error',
}

const options = [
    DebuggingOptions.remote,
    DebuggingOptions.order,
];

export class Debug {
    options: DebuggingOptions[];
    constructor(options: DebuggingOptions[]) { this.options = options; }
    hasOption(option: DebuggingOptions) { return this.options.includes(option); }
    log(option: DebuggingOptions, message: string) { if (this.hasOption(option)) { console.log(message); }}
    tLog(target: any, key: string) { console.log(`Method \'${key}\' is called on class \'${target.constructor.name}\'`); }
}

export const debug = new Debug([]);