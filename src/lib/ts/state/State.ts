import { k, Appearance, Transparency } from '../common/GlobalImports';

type MouseState = {clicks: number, hit: boolean};
type RingState_byName = {[name: string]: RingState};
type MouseState_byName = {[name: string]: MouseState};

class RingState {
	isHit = false;
	cursor = k.cursor_default;
	transparency = Transparency.faint;
	startAngle: number | null = null;		// angle at location of mouse DOWN
	priorAngle: number | null = null;		// angle at location of previous mouse MOVE
	radiusOffset: number | null = null;		// distance from arc radius to location of mouse DOWN

	reset() {
		this.isHit = false;
		this.cursor = k.cursor_default;
		this.transparency = Transparency.faint;
		this.priorAngle = this.startAngle = this.radiusOffset = null;
	}
}

class State {

	//////////////////////////////////////
	//									//
	//	repository of state for			//
	//	transient svelte components		//
	//	that need to store state		//
	//	somewhere outside themselves	//
	//									//
	//	MouseButton, its containers,	//
	//	  like EditingTools & Controls	//
	//									//
	//////////////////////////////////////

	rebuild_count = 0;
	ringState_byName: RingState_byName = {};
	mouseState_byName: MouseState_byName = {};
	appearance_byName: {[name: string]: Appearance} = {};

	ringState_forName(name: string): RingState {
		let state = this.ringState_byName[name];
		if (!state) {
			state = new RingState();
			this.ringState_byName[name] = state;
		}
		return state;
	}

	mouseState_forName(name: string): MouseState {
		let state = this.mouseState_byName[name];
		if (!state) {
			state = {clicks: 0, hit: false};
			this.mouseState_byName[name] = state;
		}
		return state;
	}

	appearance_forName(name: string): Appearance {
		let appearance = this.appearance_byName[name];
		if (!appearance) {
			appearance = new Appearance(k.color_defaultText, 'transparent', k.cursor_default);
			this.appearance_byName[name] = appearance;
		}
		return appearance;
	}

}

export let s = new State();
