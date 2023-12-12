<script lang="ts">
	import { Point, Thing, dbDispatch, Hierarchy } from '../ts/common/GlobalImports';
	import { SvelteFlow, Controls, type NodeProps } from '@xyflow/svelte';
	import { writable } from 'svelte/store';
	import '@xyflow/svelte/dist/style.css';
	import Widget from './Widget.svelte';

	// type $$Props = NodeProps;
	// const nodeTypes = {
	// 	'widget': Widget
	// };

	// const nodes = writable([
	// 	{
	// 		id: '1',
	// 		type: 'widget',
	// 		position: { x: 240, y: 200 },
	// 		data: { label: 'title of Widget' },
	// 		style: 'padding: 20px 20px; background: white;',
	// 	},
	// ]);

	const nodes = writable<Node[]>([]);
	const edges = writable<Edge[]>([]);
</script>

<SvelteFlow {nodes} {edges}>
    <Controls />
	<Widget/>
</SvelteFlow>