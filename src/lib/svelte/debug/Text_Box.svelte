<script lang='ts'>
	export let text = 'If you can read this, your TextBox needs its text set.';
</script>

<div class="container">
	<div class="text-box">
		{@html text}
	</div>
</div>

<style>
	b {
		color: blue;
		font-weight: normal;
	}
	.container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100h;
	}

	.text-box {
		width: 97%;
		border: 1px solid #333;
		border-radius: 7px;
		text-align: center;
		color: '#e4f6c9';
		padding: 5px;
	}
</style>
