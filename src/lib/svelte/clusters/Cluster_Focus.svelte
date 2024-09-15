<script lang='ts'>
	import { g, k, ux, Point, IDTool, ZIndex, ElementType, Clusters_Geometry } from '../../ts/common/Global_Imports';
	import { s_user_graphOffset, s_ancestry_showingTools } from '../../ts/state/Reactive_State';
	import { s_ancestry_focus, s_thing_fontFamily } from '../../ts/state/Reactive_State';
	import Editing_Tools from '../widget/Editing_Tools.svelte';
	import Title_Editor from '../widget/Title_Editor.svelte';
	const element_state = ux.elementState_for($s_ancestry_focus, ElementType.focus, IDTool.none);
	let toolsOffset = new Point(31, -23.5).offsetBy($s_user_graphOffset.negated);
	let titleCenter = Point.zero;

	$: {
		const titleWidth = $s_ancestry_focus?.thing?.titleWidth ?? 0;
		const offsetX = -9 - k.thing_fontSize - (titleWidth / 2);
		titleCenter = g.graph_center.offsetByXY(offsetX, k.cluster_offsetY);
		// rebuilds += 1;
	}

</script>

{#if $s_ancestry_showingTools?.isVisible}
	<Editing_Tools offset={toolsOffset}/>
{/if}
<div class='cluster-focus'
	style='
		position: absolute;
		top:{titleCenter.y}px;
		left: {titleCenter.x}px;
		z-index: {ZIndex.panel};
		border-radius: {k.dot_size}px;
		border: {element_state.border};'>
	<Title_Editor
		ancestry={$s_ancestry_focus}
		fontSize={k.thing_fontSize}px
		fontFamily={$s_thing_fontFamily}/>
</div>