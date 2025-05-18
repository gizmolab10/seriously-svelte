<script lang='ts'>
	import { k, w, Rect, Point, T_Layer } from '../../ts/common/Global_Imports';
	import type { Integer } from '../../ts/common/Types';
	export let font_size = k.font_size.small;
	export let row_height = 12;
	export let name = k.empty;
	export let width = 180;
	export let top = 0;
	export let array;
	let table;

	export function location_ofCellAt(x: Integer, y: Integer): Point {
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
		const origin = Rect.createFromDOMRect(cell.getBoundingClientRect()).origin.multipliedBy(1 / w.scale_factor);
		return origin.offsetByY(-top);
	}

</script>

{#if array}
	<div class={name}
		style='
			left:10px;
			top:{top}px;
			position:absolute;
			font-size:{font_size}px;
			z-index: {T_Layer.details};'>
		<table 
			bind:this={table}
			style='width: {width}px; left:12px; color:black;'>
			{#each array as [key, value]}
				<tr>
					<td class='first-column' style='line-height:{row_height}px;'>{key}:</td>
					<td class='second-column' style='line-height:{row_height}px;'>{value}</td>
				</tr>
			{/each}
		</table>
	</div>
{/if}

<style>
	.first-column {
		border-right: 1px solid transparent;
		text-align: right;
		color:black;
		width: 30%;
	}
	.second-column {
	}
</style>
