
class State {
	rebuild_count = 0;
	ring_cursor = 'normal';
	ring_startAngle: number | null = null;		// angle at location of mouse DOWN
	ring_priorAngle: number | null = null;		// angle at location of previous mouse MOVE
	ring_radiusOffset: number | null = null;	// distance from arc radius to location of mouse DOWN
	mouseClickCounts_byName: {[name: string]: number} = {};

	mouseClickCount_forName(name: string) { return this.mouseClickCounts_byName[name]; }
	incrementMouseClickCount_forName(name: string) { this.mouseClickCounts_byName[name] += 1; }
	resetRingState() { this.ring_priorAngle = this.ring_startAngle = this.ring_radiusOffset = null; }
	setMouseClickCount_forName(name: string, count: number) { this.mouseClickCounts_byName[name] = count; }

}

export let s = new State();
