<script lang='ts'>
    import { k, ux, Point, colors, T_Element, S_Element } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
    import Button from './Button.svelte';
    export let closure: (s_mouse: S_Mouse, column: number) => void;
	export let origin: Point | null = null;
    export let button_titles: string[];
    export let button_height = 15;
    export let font_size: number;
	export let name = k.empty;
    export let width: number;
    export let gap = 2;
	const s_element_byColumn: { [key: number]: S_Element } = {};
    const columns = button_titles.length;
    const title_width = 34;
    
    setup_s_elements();

    function button_left_for(column: number): number {
        return (column == 0) ? 0 : gap - 1 + title_width + 2 + (button_width_for(column) + gap) * (column - 1);
    }

    function button_width_for(column: number): number {
        let button_width = title_width;
        if (column != 0) {
            button_width = Math.floor((width - button_width - gap - 3) / (columns - 1)) - gap;
        }
        return button_width;
	}

	function setup_s_elements() {
        for (let column = 1; column <= columns; column++) {
            const es_tool = ux.s_element_for(new Identifiable(`${column}`), T_Element.tool, column);
            es_tool.set_forHovering(colors.default, 'pointer');
            s_element_byColumn[column] = es_tool;
        }
	}

    function intercept_closure(s_mouse: S_Mouse, column: number) {
        const s_element = s_element_byColumn[column];
        if (!!s_element && s_mouse.isHover) {
            s_element.isOut = s_mouse.isOut;
        }
        closure(s_mouse, column);
    }

</script>

<div class='buttons-array'
    style='
        width: {width}px;
        top:{origin.y}px;
        left:{origin.x}px;
        position:absolute;
        height: {button_height}px;'>
    {#each button_titles as title, column}
        {#if column == 0}
            <div
                class='button-title'
                style='
                    top:0px;
                    position:absolute;
                    text-align: right;
                    font-size:{font_size + 1}px;
                    width:{button_width_for(column)}px;
                    left:{button_left_for(column)}px;'>
                {title}
            </div>
        {:else}
            <Button
                font_size={font_size}
                height={button_height}
                name={`${name}-${column}`}
                width={button_width_for(column)}
                es_button={s_element_byColumn[column]}
                origin={Point.x(button_left_for(column))}
                closure={(s_mouse) => intercept_closure(s_mouse, column)}>
                {title}
            </Button>
        {/if}
    {/each}
</div>
