<script lang='ts'>
    import {S_Mouse, S_Element, T_Element, T_Request, T_Action } from '../../ts/common/Global_Imports';
    import { w_background_color, w_s_alteration } from '../../ts/common/Stores';
    import { k, show, Point, colors } from '../../ts/common/Global_Imports';
    import Buttons_Row from './Buttons_Row.svelte';
    export let closure: (t_request: T_Request, s_mouse: S_Mouse, name: string, row: number, column: number) => boolean;
    export let button_titles: string[][];
	export let detect_autorepeat = false;
	export let detect_longClick = false;
    export let type = T_Element.button;
    export let has_seperator = false;         // false means row titles precede buttons
    export let font_sizes: number[];
    export let button_height = 15;
    export let has_title = true;              // false means all titles are buttons, true means first one is row title
    export let row_offset = 0;
	export let name = k.empty;
    export let width: number;
    export let title_gap = 8;
    export let gap = 2;
    export let top = 0;
	const rows = button_titles.length;
    const box_top = (has_title && has_seperator) ? 12 : 0;
    
    function button_origin_for(row: number): Point { return Point.y(row * (button_height + gap + box_top)); }

</script>

<div class='buttons-table'
    style='
        left:1px;
        top:{top}px;
        width:{width}px;
        position:relative;
        height:{(rows * button_height) + ((rows - 1) * gap)}px;'>
    {#each button_titles as titles, row}
        {#if closure(T_Request.is_visible, S_Mouse.empty, name, row, -1)}
            <Buttons_Row
                gap={gap}
                type={type}
                width={width}
                row_titles={titles}
                has_title={has_title}
                title_gap={title_gap}
                font_sizes={font_sizes}
                has_seperator={has_seperator}
                button_height={button_height}
                origin={button_origin_for(row)}
                detect_longClick={detect_longClick}
                detect_autorepeat={detect_autorepeat}
                name={`${name}-table-${T_Action[row]}`}
                closure={(t_request, s_mouse, column) => closure(t_request, s_mouse, name, row + row_offset, column)}/>
        {/if}
    {/each}
</div>
