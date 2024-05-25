
class Events {
	rebuild_count = 0;
	mouse_click_count = 0;
	ring_startAngle: number | null = null;		// angle at location of mouse DOWN
	ring_priorAngle: number | null = null;		// angle at location of previous mouse MOVE
	ring_radiusOffset: number | null = null;	// distance from arc radius to location of mouse DOWN
}

export let e = new Events();
