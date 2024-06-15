<script lang='ts'>
	import { s_indices_cluster, s_indices_reversed, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { g, k, s, Point, onMount, Direction, ElementState, ClusterLayout, AdvanceMapRect } from '../../ts/common/GlobalImports';
    import TriangleButton from '../mouse buttons/TriangleButton.svelte'
	export let layout: ClusterLayout;
	export let center = Point.zero;
	export let isForward = false;
	const size = 13;
	let map!: AdvanceMapRect;
	let state!: ElementState;

	onMount(() => {
		map = layout.advanceMapRects[isForward ? 1 : 0];
		state = map.elementState;		// DOES this survive onDestroy? created by ClusterLayout
	})

	function hover_closure(isFilled) { return [k.empty, k.empty]; }
	function mouse_closure(mouseState) {}

</script>

{#if state}
	<TriangleButton
		hover_closure={hover_closure}
		mouse_closure={mouse_closure}
		strokeColor={state.stroke}
		angle={Direction.right}
		center={center}
		size={size}
	/>
{/if}
