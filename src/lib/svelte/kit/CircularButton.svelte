<script>
	export let borderColor = '#333';
	export let textColor = '#400';
	export let color = '#ccc';
	export let onClick = null;
	export let size = 14;
	export let left = 7;
	export let top = 7;

	function ignore(event) {}
</script>

<div
	on:click={onClick}
	on:keypress={ignore}
	style='
		position: absolute;
		left: {left}px;
		top: {top}px;
		transform: translate(-50%, -50%);
		width: {size}px;
		height: {size}px;
		font-size: {size - 1}px;;
		line-height: {size}px;
		color: {textColor}
		background-color: {color};
		border: 1px solid {borderColor};
		border-radius: 50%;
		display: inline-block;
		text-align: center;
		font-weight: bold;
		cursor: pointer;
	'>
	<slot></slot>
</div>
