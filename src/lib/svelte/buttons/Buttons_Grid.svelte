<script lang='ts'>
    import {S_Mouse, S_Element, T_Element, T_ToolRequest, T_Tool } from '../../ts/common/Global_Imports';
    import { w_background_color, w_s_alteration } from '../../ts/common/Stores';
    import { k, show, Point, colors } from '../../ts/common/Global_Imports';
    import Buttons_Row from './Buttons_Row.svelte';
    export let closure: (t_toolRequest: T_ToolRequest, s_mouse: S_Mouse, row: number, column: number) => boolean;
    export let button_titles: string[][];
    export let font_sizes: Array<number>;
    export let has_title = true;        // false means all titles are buttons, true means first one is row title
    export let show_box = true;         // false means row titles precede buttons
    export let button_height = 15;
	export let name = k.empty;
    export let width: number;
    export let gap = 2;
	const rows = button_titles.length;
    const box_top = (has_title && show_box) ? 12 : 0;
    
    function button_origin_for(row: number): Point { return Point.y(row * (button_height + gap + box_top)); }

</script>

<div class='buttons-grid'
    style='
        left:1px;
        width:{width}px;
        position:absolute;
        height:{(rows * button_height) + ((rows - 1) * gap)}px;'>
    {#each button_titles as titles, row}
        {#if closure(T_ToolRequest.is_visible, S_Mouse.empty, row, -1)}
            <Buttons_Row
                gap={gap}
                width={width}
                box_top={box_top}
                row_titles={titles}
                show_box={show_box}
                has_title={has_title}
                font_sizes={font_sizes}
                button_height={button_height}
                origin={button_origin_for(row)}
                name={`${name}-grid-${T_Tool[row]}`}
                closure={(t_toolRequest, s_mouse, column) => closure(t_toolRequest, s_mouse, row, column)}/>
        {/if}
    {/each}
</div>
