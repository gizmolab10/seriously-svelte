import { k } from '../../ts/common/Global_Imports';

export enum T_Timer {
	repeat	= 'repeat',
	double	= 'double',
	long	= 'long',
	alteration = 'alteration',
}

export default class Mouse_Timer {
	doubleClick_timer: null | number | NodeJS.Timeout = null;
	autorepeat_timer: null | number | NodeJS.Timeout = null;
	alteration_timer: null | number | NodeJS.Timeout = null;
	longClick_timer: null | number | NodeJS.Timeout = null;
	autorepeat_ID: number = -1;

	isAutorepeating_forID(id: number): boolean { return this.autorepeat_ID === id; }
	get hasTimer(): boolean { 
		return !!this.doubleClick_timer || !!this.longClick_timer || !!this.autorepeat_timer || !!this.alteration_timer; 
	}

	autorepeat_start(id: number, callback: () => void) {
		this.timeout_start(T_Timer.double, () => {
			this.autorepeat_stop();
			this.autorepeat_ID = id;
			callback();
			this.autorepeat_timer = setInterval(callback, k.threshold.autorepeat);
		}, true);
	}

	autorepeat_stop() {
		if (this.autorepeat_timer) {
			clearInterval(this.autorepeat_timer);
			this.autorepeat_timer = null;
		}
		this.autorepeat_ID = -1;
	}

	alteration_start(callback: (invert: boolean) => void) {
		this.alteration_stop();
		let invert = true;
		this.alteration_timer = setInterval(() => {
			callback(invert);
			invert = !invert;
		}, k.threshold.alteration);
	}

	alteration_stop() {
		if (this.alteration_timer) {
			clearInterval(this.alteration_timer);
			this.alteration_timer = null;
		}
	}
	
	timeout_start(type: T_Timer, callback: (args: void) => void, force: boolean = false) {
		if (type == T_Timer.long) {
			if (force && !!this.longClick_timer) {
				clearTimeout(this.longClick_timer);
				this.longClick_timer = null;
			}
			if (!this.longClick_timer) {
				this.longClick_timer = setTimeout(() => {
					this.longClick_timer = null;
					callback();
				}, k.threshold.long_click);
			}
		} else if (type == T_Timer.double) {
			if (force && !!this.doubleClick_timer) {
				clearTimeout(this.doubleClick_timer);
				this.doubleClick_timer = null;
			}
			if (!this.doubleClick_timer) {
				this.doubleClick_timer = setTimeout(() => {
					this.doubleClick_timer = null;
					callback();
				}, k.threshold.double_click);
			}
		}
	}

	reset() {	// tear down
		if (!!this.doubleClick_timer) {
			clearTimeout(this.doubleClick_timer);
			this.doubleClick_timer = null;
		}
		if (!!this.longClick_timer)  {
			clearTimeout(this.longClick_timer);
			this.longClick_timer = null;
		}
		if (!!this.autorepeat_timer) {
			clearInterval(this.autorepeat_timer);
			this.autorepeat_timer = null;
		}
		if (!!this.alteration_timer) {
			clearInterval(this.alteration_timer);
			this.alteration_timer = null;
		}
		this.autorepeat_ID = -1;
	}

}