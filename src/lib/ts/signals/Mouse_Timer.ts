import { k } from '../../ts/common/Global_Imports';

export enum E_Timer {
	double	= 'double',
	long	= 'long',
}

export default class Mouse_Timer {
	mouse_longClick_timer!: null | number | NodeJS.Timeout;
	mouse_doubleClick_timer!: null | number | NodeJS.Timeout;

	get hasTimer(): boolean {
		return !!this.mouse_doubleClick_timer || !!this.mouse_longClick_timer;
	}

	reset() {	// tear down
		if (!!this.mouse_doubleClick_timer) {
			clearTimeout(this.mouse_doubleClick_timer);
			this.mouse_doubleClick_timer = null;
		}
		if (!!this.mouse_longClick_timer)  {
			clearTimeout(this.mouse_longClick_timer);
			this.mouse_longClick_timer = null;
		}
	}
	
	setTimeout(type: E_Timer, callback: (args: void) => void, ms?: number) {
		if (type == E_Timer.long && !this.mouse_longClick_timer) {
			this.mouse_longClick_timer = setTimeout(() => {
				callback();
			}, k.threshold.long_click);
		} else if (type == E_Timer.double && !this.mouse_doubleClick_timer) {
			this.mouse_doubleClick_timer = setTimeout(() => {
				callback();
			}, k.threshold.double_click);
		}

	}
}