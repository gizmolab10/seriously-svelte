<script lang="ts">
	import { k, Point } from '../../ts/common/Global_Imports';
	import Vertical_Stack from '../kit/Vertical_Stack.svelte';
	import Hideable from '../kit/Hideable.svelte';
	const width = k.width_details;
</script>

<Vertical_Stack origin={Point.y(30)} width={width}>
	<Hideable title='storage' width={width} isHidden={false}>
		<h2>First Section</h2>
		<p>Any <b>Svelte</b> or HTML content here!</p>
	</Hideable>
	<Hideable title='tools' width={width} isHidden={false}>
		<h2>Second Section</h2>
		<p>More <i>arbitrary</i> content here.</p>
	</Hideable>
</Vertical_Stack>
