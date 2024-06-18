<script lang='ts'>
	import { s_indices_cluster, s_indices_reversed, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { ElementState, ClusterMap, AdvanceMapRect } from '../../ts/common/GlobalImports';
	import { g, k, s, Point, onMount, Direction } from '../../ts/common/GlobalImports';
    import TriangleButton from '../mouse buttons/TriangleButton.svelte'
	export let cluster_map: ClusterMap;
	export let isForward = false;
	const size = k.debug_size;
	let state!: ElementState;
	let advance_map!: AdvanceMapRect;

	onMount(() => {
		advance_map = cluster_map.advance_maps[isForward ? 1 : 0];
		state = advance_map.elementState;		// DOES this survive onDestroy? created by ClusterMap
	})

	function hover_closure(isHovering) {
		return ['transparent', 'green'];
	}

	function mouse_closure(mouseState) {
		if (mouseState.isDown) {
			console.log(advance_map.title + ' BANG! ' + advance_map.total);
		}
	}

</script>

{#if state}
	<TriangleButton
		angle={isForward ? Direction.right : Direction.left}
		hover_closure={hover_closure}
		mouse_closure={mouse_closure}
		center={advance_map.center}
		strokeColor={state.stroke}
		elementState={state}
		name={state.name}
		size={size}>
		{advance_map.title}
	</TriangleButton>
{/if}
