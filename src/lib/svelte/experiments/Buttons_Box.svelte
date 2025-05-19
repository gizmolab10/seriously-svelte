<script lang='ts'>
    import { k, ux, show, Point, colors, T_ButtonRequest, T_Element, S_Element } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Separator from '../kit/Separator.svelte';
    import Buttons_Row from './Buttons_Row.svelte';
    export let closure: (t_buttonRequest: T_ButtonRequest, s_mouse: S_Mouse, column: number) => boolean;
	export let origin: Point | null = null;
    export let font_sizes: Array<number>;
    export let button_titles: string[];
    export let button_height = 15;
    export let show_box = false;
	export let name = k.empty;
    export let width: number;
    export let box_top = 6;
    export let gap = 2;
    const title_width = 34;
    const x_offset = show_box ? gap : title_width;
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
    {#if show_box}
        <Separator
            top={3}
            width={width}
            add_wings={true}
            title={button_titles[0]}
            margin={k.details_margin}
            thickness={k.thickness.thin}
            title_font_size={font_sizes[0]}
            title_left={k.separator_title_left}/>
    {:else}
        <div
            class='box-title'
            style='
                top: 1.5px;
                text-align: right;
                position:absolute;
                width:{title_width - gap}px;
                font-size:{font_sizes[0]}px;'>
            {button_titles[0]}
        </div>
    {/if}
    <Buttons_Row
        gap={gap}
        name={name}
        closure={closure}
        width={row_width}
        origin={origin_of_box}
        font_size={font_sizes[1]}
        button_height={button_height}
        button_titles={button_titles.slice(1)}/>
</div>
