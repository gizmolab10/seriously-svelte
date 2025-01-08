<script lang='ts'>
	import { k, ZIndex } from '../../ts/common/Global_Imports';
	import type { Integer } from '../../ts/common/Types';
	export let top = 0;
	export let array;
	let table;

	function location_ofCellAt(x: Integer, y: Integer): Point {
		const rows = table.rows;
		if (x >= rows.length) {
		  console.error('Row index out of bounds');
		}
		const row = rows[x];
		const cells = row.cells;
		if (y >= cells.length) {
		  console.error('Column index out of bounds');
		}
		const cell = cells[y];
		const rect = cell.getBoundingClientRect();
		return new Point(rect.left, rect.top);
	}

</script>

<style>
	.first {
		border-right: 1px solid transparent;
		text-align: right;
		line-height:12px;
		color:black;
		width: 30%;
	}
	.second {
		line-height:12px;
	}
</style>

{#if array}
	<div class='ancestry-info'
		bind:this={table}
		style='
			left:10px;
			top:{top}px;
			position:absolute;
			z-index: {ZIndex.details};'>
		<table style='width: {k.width_details}px; left:12px; color:black;'>
			{#each array as [key, value]}
				<tr>
					<td class='first'>{key}:</td>
					<td class='second'>{value}</td>
				</tr>
			{/each}
		</table>
	</div>
{/if}
