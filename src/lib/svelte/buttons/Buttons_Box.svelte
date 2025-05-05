<script lang='ts'>
    import { k, ux, show, Point, colors, T_Element, S_Element } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Separator from '../kit/Separator.svelte';
    import Buttons_Row from './Buttons_Row.svelte';
    export let closure: (s_mouse: S_Mouse, column: number) => void;
	export let origin: Point | null = null;
    export let button_titles: string[];
    export let button_height = 15;
    export let font_size: number;
    export let show_box = false;
	export let name = k.empty;
    export let width: number;
    export let box_top = 6;
    export let gap = 2;
    const title_width = 34;
    const x_offset = show_box ? gap : title_width;
	const separator_font_size = `${k.font_size.smallest}px`;
    const origin_of_box = new Point(origin.x + x_offset, show_box ? box_top : 0);
    const row_width = width - gap - x_offset;

</script>

<div class='buttons-box'
    style='
        width: {width}px;
        top:{origin.y}px;
        left:{origin.x}px;
        position:absolute;
        height: {button_height}px;'>
    {#if !show_box}
        <div
            class='box-title'
            style='
                text-align: right;
                position:absolute;
                width:{title_width - gap}px;
                font-size:{font_size}px;'>
            {button_titles[0]}
        </div>
    {:else}
        <Separator
            top=2
            left=14
            title_left={50}
            width={width - 28}
            title={button_titles[0]}
            thickness={k.thickness.thin}
            title_font_size={separator_font_size}/>
    {/if}
    <Buttons_Row
        gap={gap}
        name={name}
        closure={closure}
        width={row_width}
        font_size={font_size}
        origin={origin_of_box}
        button_height={button_height}
        button_titles={button_titles.slice(1)}/>
</div>
