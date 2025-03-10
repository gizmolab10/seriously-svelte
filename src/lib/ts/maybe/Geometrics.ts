import { G_Segment, G_TreeGraph } from '../common/Global_Imports';

export default class Geometrics {
	rebuild_needed_byType: {[type: string]: boolean} = {};
	g_segment_byName: { [name: string]: G_Segment } = {};
	g_treeGraph = new G_TreeGraph();

	require_rebuild_forType(type: string) { this.rebuild_needed_byType[type] = true; }
	g_segment_forName(name: string): G_Segment { return this.g_segment_byName[name]; }
	set_g_segment_forName(g_segment: G_Segment, name: string) { return this.g_segment_byName[name] = g_segment; }

	readOnce_rebuild_needed_forType(type: string) : boolean {
		const needed = this.rebuild_needed_byType[type];
		this.rebuild_needed_byType[type] = false;
		return needed;
	}

}

export const g = new Geometrics();
