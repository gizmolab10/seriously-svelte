<script lang='ts'>
    import { Size, Point } from '../../ts/common/Global_Imports';
    import Button from './Button.svelte';
    export let width: number;
    export let columns: number;
    export let font_size: number;
    export let button_height = 15;
    export let gap = new Size(2, 3);
    export let button_titles: string[][];
    const rows = button_titles.length;

    function button_origin_for(row: number, column: number): Point {
        let button_width = 36;
        const y = row * (button_height + gap.height);
        let x = (column == 0) ? 0 : gap.width + button_width + (button_width_for(row, column) + gap.width) * (column - 1);
        return new Point(x, y);
    }

    function button_width_for(row: number, column: number): number {
        if (column != 0) {
            const columns_forRow = button_titles[row].length - 1;
            return Math.floor((width - 44 - gap.width) / columns_forRow);
        }
        return 34;
    }

</script>

<div class='buttons-grid'
    style='
        top:2px;
        left:1px;
        width: {width}px;
        position:absolute;
        height: {(rows * button_height) + ((rows - 1) * gap.height)}px;'>
    {#each button_titles as row, row_index}
        {#each row as title, col_index}
            {#if col_index == 0}
                <div
                    class='button-title'
                    style='
                        position:absolute;
                        text-align: right;
                        font-size:{font_size + 1}px;
                        width:{button_width_for(row_index, col_index)}px;
                        top:{button_origin_for(row_index, col_index).y}px;
                        left:{button_origin_for(row_index, col_index).x}px;'>
                    {title}
                </div>
            {:else}
                <Button
                    font_size={font_size}
                    height={button_height}
                    width={button_width_for(row_index, col_index)}
                    origin={button_origin_for(row_index, col_index)}>
                    {title}
                </Button>
            {/if}
        {/each}
    {/each}
</div>
