<script>
	import { u } from '../../ts/common/GlobalImports';
	export let mouse_click_closure = null;
	export let borderColor = '#333';
	export let textColor = '#400';
	export let color = '#ccc';
	export let size = 14;
	export let left = 7;
	export let top = 7;
</script>

<div
	on:click={mouse_click_closure}
	on:keypress={u.ignore}
	style='
		top: {top}px;
		display: flex;
		left: {left}px;
		cursor: pointer;
		width: {size}px;
		height: {size}px;
		color: {textColor}
		font-weight: bold;
		position: absolute;
		border-radius: 50%;
		align-items: center;
		line-height: {size}px;
		justify-content: center;
		font-size: {size - 1}px;;
		background-color: {color};
		border: 1px solid {borderColor};
		transform: translate(-50%, -50%);
	'>
	<slot></slot>
</div>
