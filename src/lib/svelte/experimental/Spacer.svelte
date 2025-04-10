<script lang='ts'>
	interface Props {
		width?: number;
	}

	let { width = 10 }: Props = $props();
</script>

<div style='width: {width}px; position: absolute;'></div>
