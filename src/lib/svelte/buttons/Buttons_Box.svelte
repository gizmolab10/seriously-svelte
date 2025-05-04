<script lang='ts'>
    import { k, ux, Point, colors, T_Element, S_Element } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
    import Buttons_Box from './Buttons_Box.svelte';
    export let closure: (s_mouse: S_Mouse, column: number) => void;
	export let origin: Point | null = null;
    export let button_titles: string[];
    export let button_height = 15;
    export let font_size: number;
	export let name = k.empty;
    export let width: number;
    export let gap = 2;

</script>

<div class='buttons-box'
    style='
        width: {width}px;
        top:{origin.y}px;
        left:{origin.x}px;
        position:absolute;
        height: {button_height}px;'>
    <Buttons_Box
        gap={gap}
        name={name}
        width={width}
        origin={origin}
        closure={closure}
        font_size={font_size}
        button_height={button_height}
        button_titles={button_titles}/>
</div>
