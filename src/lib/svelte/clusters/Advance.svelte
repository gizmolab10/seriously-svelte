<script lang='ts'>
	import { ElementState, ClusterMap, AdvanceMapRect } from '../../ts/common/GlobalImports';
	import { k, onMount, Direction } from '../../ts/common/GlobalImports';
    import TriangleButton from '../mouse buttons/TriangleButton.svelte'
	export let cluster_map: ClusterMap;
	export let isForward = false;
	const size = k.debug_size;
	let state!: ElementState;
	let advance_map!: AdvanceMapRect;

	onMount(() => {
		advance_map = cluster_map.get_advanceMap_for(isForward);
		state = advance_map.elementState;		// DOES this survive onDestroy? created by ClusterMap
	})

	function hover_closure(isHovering) {
		return ['transparent', 'green'];
	}

	function mouse_closure(mouseState) {
		if (mouseState.isDown) {
			cluster_map.advance(isForward);		// UX will respond
		}
	}

</script>

{#if state && advance_map.isVisible}
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
