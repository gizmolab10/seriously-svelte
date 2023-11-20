<script>
    import { popupViewID } from '../../ts/managers/State';
    import { noop } from '../../ts/common/GlobalImports';
	export let size = 20;
</script>

<div class='close-button' style='
    width: {size}px;
    height: {size}px;
    font-size: {size - 1}px;;
    line-height: {size}px;'
    on:keypress={noop()}
    on:click={() => { $popupViewID = null; }}>
    ×
</div>

<style>
	.close-button {
		display: inline-block;
		text-align: center;
		cursor: pointer;
		color: #000;
		position: absolute;
		border: 1px solid black;
		border-radius: 50%;
		top: 10px;
		right: 10px;
	}
</style>