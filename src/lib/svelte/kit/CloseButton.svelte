<script>
    import { id_popupView } from '../../ts/managers/State';
	export let size = 20;
	function ignore(event) {}
</script>

<style>
	.close-button {
		display: inline-block;
		text-align: center;
		cursor: pointer;
		color: #000;
		position: absolute;
		border: 1px solid black;
		border-radius: 50%;
		top: 20px;
		right: 20px;
	}
</style>

<div class='close-button' style='
    width: {size}px;
    height: {size}px;
    font-size: {size - 1}px;;
    line-height: {size}px;'
    on:keypress={ignore}
    on:click={() => { $id_popupView = null; }}>
    ×
</div>
