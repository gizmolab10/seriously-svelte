import { G_Widget, G_Segment, G_TreeGraph } from '../common/Global_Imports';

export default class Geometrics {
	g_widget_byAncestryID: { [id: string]: G_Widget } = {};
	rebuild_needed_byType: {[type: string]: boolean} = {};
	g_segment_byName: { [name: string]: G_Segment } = {};
	g_treeGraph = new G_TreeGraph();

	g_widget_forID(id: string): G_Widget { return this.g_widget_byAncestryID[id]; }
	g_segment_forName(name: string): G_Segment { return this.g_segment_byName[name]; }
	require_rebuild_forType(type: string) { this.rebuild_needed_byType[type] = true; }
	set_g_widget_forID(g_widget: G_Widget, id: string) { return this.g_widget_byAncestryID[id] = g_widget; }
	set_g_segment_forName(g_segment: G_Segment, name: string) { return this.g_segment_byName[name] = g_segment; }

	readOnce_rebuild_needed_forType(type: string) : boolean {
		const needed = this.rebuild_needed_byType[type];
		this.rebuild_needed_byType[type] = false;
		return needed;
	}

}

export const g = new Geometrics();
