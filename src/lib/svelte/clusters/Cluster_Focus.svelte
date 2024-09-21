<script lang='ts'>
	import { g, k, ux, Size, Point, IDTool, ZIndex, svgPaths, } from '../../ts/common/Global_Imports';
	import { s_user_graphOffset, s_ancestry_showingTools } from '../../ts/state/Reactive_State';
	import { s_ancestry_focus, s_thing_fontFamily } from '../../ts/state/Reactive_State';
	import { ElementType, Clusters_Geometry } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	import Title_Editor from '../widget/Title_Editor.svelte';
	const element_state = ux.elementState_for($s_ancestry_focus, ElementType.focus, IDTool.none);
	const height = k.row_height + 10;
	let centerOffset = Point.zero;
	let focus_origin = Point.zero;
	let titleWidth = 0;

	$: {
		titleWidth = 10 + ($s_ancestry_focus?.thing?.titleWidth ?? 0);
		const offsetX = -titleWidth / 2;
		focus_origin = g.graph_center.offsetByXY(offsetX, 1 - k.dot_size);
		centerOffset = new Point(titleWidth + 25, height).dividedInHalf;
	}

	function mouse_state_closure(mouse_state) {
		console.log(mouse_state.description)
	}

</script>

<div class='cluster-focus'
	style='
		height:{height}px;
		position: absolute;
		width:{titleWidth}px;
		top:{focus_origin.y}px;
		z-index: {ZIndex.panel};
		left: {focus_origin.x}px;'>
		<Mouse_Responder
			height={height}
			name=focus-border
			width={titleWidth}
			zindex={ZIndex.panel}
			detect_longClick={false}
			cursor={k.cursor_default}
			isHit_closure={() => false}
			center={centerOffset.offsetByX(-13)}
			mouse_state_closure={mouse_state_closure}>
		<svg
			style='
				top: -2.7px;
				left: -13px;
				height:{height}px;
				position: absolute;
				width:{titleWidth + 40}px;'>
			<path
				fill='white'
				stroke={$s_ancestry_focus?.thing?.color}
				d={svgPaths.oblong(centerOffset, new Size(titleWidth - 6, k.row_height))}/>
		</svg>
		</Mouse_Responder>
	<div class='cluster-focus-title'
		style='
			top:3px;
			position: absolute;'>
		<Title_Editor
			ancestry={$s_ancestry_focus}
			fontSize={k.thing_fontSize}px
			fontFamily={$s_thing_fontFamily}/>
	</div>
</div>