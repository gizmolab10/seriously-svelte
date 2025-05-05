<script lang='ts'>
    import { k, Point, colors, T_Element, S_Element } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
    import Buttons_Box from './Buttons_Box.svelte';
    export let closure: (s_mouse: S_Mouse, row: number, column: number) => void;
    export let button_titles: string[][];
    export let button_height = 15;
    export let show_boxes = true;
    export let font_size: number;
    export let width: number;
    export let gap = 2;
	const rows = button_titles.length;

    function button_origin_for(row: number): Point {
        return Point.y(row * (button_height + gap));
    }

</script>

<div class='buttons-grid'
    style='
        top:0px;
        left:1px;
        width: {width}px;
        position:absolute;
        height: {(rows * button_height) + ((rows - 1) * gap)}px;'>
    {#each button_titles as titles, row}
        <Buttons_Box
            gap={gap}
            width={width}
            show_box={show_boxes}
            font_size={font_size}
            button_titles={titles}
            name={`buttons-box-${row}`}
            button_height={button_height}
            origin={button_origin_for(row)}
            closure={(s_mouse, column) => closure(s_mouse, row, column)}/>
    {/each}
</div>
