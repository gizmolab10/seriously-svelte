<script lang='ts'>
	import { k, Rect, Point, layout, T_Layer } from '../../ts/common/Global_Imports';
	import type { Integer } from '../../ts/common/Types';
	export let font_size = k.font_size.info;
	export let number_of_columns = 2;
	export let position = 'relative';
	export let row_height = 12;
	export let name = k.empty;
	export let width = 180;
	export let left = 0;
	export let top = 0;
	export let array;
	let table;

	export function absolute_location_ofCellAt(x: Integer, y: Integer): Point {
		const rows = table.rows;
		const row = rows[x];
		const cells = row.cells;
		if (x >= rows.length) {
			console.error('Row index out of bounds');
		}
		if (y >= cells.length) {
			console.error('Column index out of bounds');
		}
		return Rect.createFromDOMRect(cells[y].getBoundingClientRect()).origin.multipliedBy(1 / layout.scale_factor);
	}

</script>

{#if array}
	<div class={name}
		style='
			width:97%;
			top:{top}px;
			left:{left}px;
			position:{position};
			font-size:{font_size}px;
			z-index: {T_Layer.details};'>
		<table 
			bind:this={table}
			style='color:black;'>
			{#each array as [key, value]}
				<tr>
					<td class='first-column' style='line-height:{row_height}px;'>{key}&nbsp;</td>
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
		width: 28%;
	}
	.second-column {
	}
</style>
