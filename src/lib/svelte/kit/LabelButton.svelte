<script lang='ts'>
	export let onClick = null;

</script>

<button
	on:click={onClick}
	style='
		border: 1px solid;
		border-radius: 0.5em;
		cursor: pointer;'>
	<slot></slot>
</button>

<style>
</style>