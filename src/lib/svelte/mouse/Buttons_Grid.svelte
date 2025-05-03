<script lang='ts'>
    import { Point } from '../../ts/common/Global_Imports';
    import Button from './Button.svelte';
    export let rows: number;
    export let width: number;
    export let columns: number;
    export let font_size: number;
    export let button_height = 15;
    export let gap = new Point(2, 3);
    export let button_titles: string[][];
	export let padding = '0px 6px 1px 6px';
    const button_width = Math.floor((width - gap.x) / columns) - gap.x;
    const right_margin = 4;

    function button_origin_for(row: number, col: number): Point {
        return new Point(
            col * (button_width + gap.x),
            row * (button_height + gap.y)
        );
    }
</script>

<div class='buttons-grid'
    style='
        top:2px;
        width: {width}px;
        position:absolute;
        left:{right_margin}px;
        height: {(rows * button_height) + ((rows - 1) * gap.y)}px;'>
    {#each button_titles as row, row_index}
        {#each row as title, col_index}
            {#if col_index == 0}
                <div
                    class='button-title'
                    style='
                        position:absolute;
                        text-align: right;
                        padding:${padding};
                        width:{button_width}px;
                        font-size:{font_size + 2}px;
                        top:{button_origin_for(row_index, col_index).y - 0.6}px;
                        left:{button_origin_for(row_index, col_index).x}px;'>
                    {title}
                </div>
            {:else}
                <Button
                    width={button_width}
                    font_size={font_size}
                    height={button_height}
                    origin={button_origin_for(row_index, col_index)}>
                    {title}
                </Button>
            {/if}
        {/each}
    {/each}
</div>
