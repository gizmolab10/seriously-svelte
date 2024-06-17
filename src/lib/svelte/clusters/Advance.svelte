<script lang='ts'>
	import { s_indices_cluster, s_indices_reversed, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { ElementState, ClusterMap, AdvanceMapRect } from '../../ts/common/GlobalImports';
	import { g, k, s, Point, onMount, Direction } from '../../ts/common/GlobalImports';
    import TriangleButton from '../mouse buttons/TriangleButton.svelte'
	export let layout: ClusterMap;
	export let isForward = false;
	const size = k.debug_size;
	let state!: ElementState;
	let map!: AdvanceMapRect;

	onMount(() => {
		map = layout.advanceMaps[isForward ? 1 : 0];
		state = map.elementState;		// DOES this survive onDestroy? created by ClusterMap
	})

	function hover_closure(isHovering) {
		return ['transparent', 'green'];
	}

	function mouse_closure(mouseState) {
		if (mouseState.isDown) {
			console.log(map.title + ' BANG! ' + map.total);
		}
	}

</script>

{#if state}
	<TriangleButton
		angle={isForward ? Direction.right : Direction.left}
		hover_closure={hover_closure}
		mouse_closure={mouse_closure}
		strokeColor={state.stroke}
		elementState={state}
		center={map.center}
		name={state.name}
		size={size}>
		{map.title}
	</TriangleButton>
{/if}
