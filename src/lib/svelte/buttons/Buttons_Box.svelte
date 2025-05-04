<script lang='ts'>
    import { k, ux, Point, colors, T_Element, S_Element } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
    import Buttons_Row from './Buttons_Row.svelte';
    export let closure: (s_mouse: S_Mouse, column: number) => void;
	export let origin: Point | null = null;
    export let button_titles: string[];
    export let button_height = 15;
    export let font_size: number;
	export let name = k.empty;
    export let width: number;
    export let gap = 2;
    const title_width = 34;
    const origin_of_box = Point.x(origin.x + title_width);

</script>

<div class='buttons-box'
    style='
        width: {width}px;
        top:{origin.y}px;
        left:{origin.x}px;
        position:absolute;
        height: {button_height}px;'>
    <div
        class='box-title'
        style='
            text-align: right;
            position:absolute;
            width:{title_width - gap}px;
            font-size:{font_size}px;'>
        {button_titles[0]}
    </div>
    <Buttons_Row
        gap={gap}
        name={name}
        closure={closure}
        font_size={font_size}
        origin={origin_of_box}
        width={width - title_width - gap}
        button_height={button_height}
        button_titles={button_titles.slice(1)}/>
</div>
