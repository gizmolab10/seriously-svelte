<script lang='ts'>
	import { s_indices_cluster, s_indices_reversed, s_cluster_arc_radius } from '../../ts/state/ReactiveState';
	import { g, k, Direction, ClusterLayout } from '../../ts/common/GlobalImports';
    import TriangleButton from './TriangleButton.svelte'
	export let layout: ClusterLayout;
	export let center = Point.zero;
	export let name = k.empty;
	export let color = 'red';
	const elementState = s.elementState_forName(name);		// survives onDestroy, created by widget
	const size = 13;

	function hover_closure(isFilled) {}
	function mouse_closure(mouseState) {}

</script>

<TriangleButton
	strokeColor={elementState.stroke}
	hover_closure={hover_closure}
	id={ancestry.thing.title}
	closure={mouse_closure}
	angle={Direction.right}
	center={center}
    size={size}
/>
