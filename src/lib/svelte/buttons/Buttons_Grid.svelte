<script lang='ts'>
    import { k, show, Point, colors, T_Request, T_Element, S_Element } from '../../ts/common/Global_Imports';
    import { w_background_color, w_s_alteration } from '../../ts/common/Stores';
    import Buttons_Box from './Buttons_Box.svelte';
    export let closure: (t_request: T_Request, s_mouse: S_Mouse, row: number, column: number) => boolean;
    export let visibility_closure: (row: number) => boolean;
    export let button_titles: string[][];
    export let font_sizes: Array<number>;
    export let button_height = 15;
    export let show_boxes = true;
    export let font_size: number;
    export let width: number;
    export let gap = 2;
    let reattachments = 0;
	const rows = button_titles.length;
    const box_top = show_boxes ? 12 : 0;
    function button_origin_for(row: number): Point { return Point.y(row * (button_height + gap + box_top)); }

    $: $w_s_alteration, reattachments += 1;

</script>

<div class='buttons-grid'
    style='
        top:0px;
        left:1px;
        width: {width}px;
        position:absolute;
        height: {(rows * button_height) + ((rows - 1) * gap)}px;'>
    {#key reattachments}
        {#each button_titles as titles, row}
            {#if visibility_closure(row)}
                <Buttons_Box
                    gap={gap}
                    width={width}
                    box_top={box_top}
                    show_box={show_boxes}
                    button_titles={titles}
                    font_sizes={font_sizes}
                    name={`buttons-box-${row}`}
                    button_height={button_height}
                    origin={button_origin_for(row)}
                    closure={(t_request, s_mouse, column) => closure(t_request, s_mouse, row, column)}/>
            {/if}
        {/each}
    {/key}
</div>
