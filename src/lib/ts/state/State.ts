import { k, Appearance } from '../common/GlobalImports';

type MouseState = {clicks: number, hit: boolean};
type MouseState_byName = {[name: string]: MouseState};

class State {
	rebuild_count = 0;
	ring_cursor = k.cursor_default;
	ring_startAngle: number | null = null;		// angle at location of mouse DOWN
	ring_priorAngle: number | null = null;		// angle at location of previous mouse MOVE
	ring_radiusOffset: number | null = null;	// distance from arc radius to location of mouse DOWN
	mouseState_byName: MouseState_byName = {};
	appearance_byName: {[name: string]: Appearance} = {};

	setMouseHit_forName(name: string, hit: boolean) { this.mouseState_forName(name).hit = hit; }
	incrementMouseClickCount_forName(name: string) { this.mouseState_forName(name).clicks += 1; }
	mouseHit_forName(name: string): boolean { return this.mouseState_forName(name)?.hit ?? false; }
	resetRingState() { this.ring_priorAngle = this.ring_startAngle = this.ring_radiusOffset = null; }
	mouseClickCount_forName(name: string): number { return this.mouseState_forName(name).clicks ?? 0; }
	setMouseClickCount_forName(name: string, count: number) { this.mouseState_forName(name).clicks = count; }
	setAppearance_forName(name: string, appearance: Appearance) { this.appearance_byName[name] = appearance; }

	appearance_forName(name: string): Appearance {
		let appearance = this.appearance_byName[name];
		if (!appearance) {
			appearance = new Appearance(k.color_defaultText, 'transparent', k.cursor_default);
			this.appearance_byName[name] = appearance;
		}
		return appearance;
	}

	mouseState_forName(name: string): MouseState {
		let state = this.mouseState_byName[name];
		if (!state) {
			state = {clicks: 0, hit: false};
			this.mouseState_byName[name] = state;
		}
		return state;
	}

}

export let s = new State();
