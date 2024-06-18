<script lang='ts'>
	import { ElementState, ClusterMap, AdvanceMapRect } from '../../ts/common/GlobalImports';
	import { k, get, onMount, Direction } from '../../ts/common/GlobalImports';
    import TriangleButton from '../mouse buttons/TriangleButton.svelte'
	export let cluster_map: ClusterMap;
	export let isForward = false;
	const size = k.debug_size;
	let rebuilds = 0;
	let isVisible = true;
	let element_state!: ElementState;
	let advance_map!: AdvanceMapRect;

	onMount(() => {
		advance_map = cluster_map.get_advanceMap_for(isForward);
		element_state = advance_map.elementState;		// DOES this survive onDestroy? created by ClusterMap
		isVisible = advance_map.isVisible;
	})

	function hover_closure(isHovering) {
		return ['transparent', 'green'];
	}

	function mouse_closure(mouseState) {
		if (mouseState.isDown) {
			advance_map = cluster_map.advance(isForward);		// UX will respond
			isVisible = advance_map.isVisible;
			rebuilds += 1;
		}
	}

</script>

{#key rebuilds}
	{#if element_state && isVisible}
		<TriangleButton
			angle={isForward ? Direction.right : Direction.left}
			strokeColor={element_state.stroke}
			hover_closure={hover_closure}
			mouse_closure={mouse_closure}
			elementState={element_state}
			center={advance_map.center}
			name={element_state.name}
			size={size}>
			{advance_map.title}
		</TriangleButton>
	{/if}
{/key}
