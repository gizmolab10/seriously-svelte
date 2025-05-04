<script lang='ts'>
    import { k, ux, Size, Point, colors, T_Tool, T_Element, S_Element } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
    import Button from './Button.svelte';
    export let closure: (s_mouse: S_Mouse, column: number) => void;
    export let button_titles: string[];
    export let button_height = 15;
    export let font_size: number;
    export let width: number;
    export let gap = 2;
	const s_element_byColumn: { [key: number]: S_Element } = {};
    const columns = button_titles.length;
    
    setup_s_elements();

    function button_width_for(column: number): number {
        if (column != 0) {
            return Math.floor((width - 44 - gap.width) / columns_inRow(row));
        }
        return 34;
	}

    function button_origin_for(column: number): Point {
        let button_width = 36;
        let x = (column == 0) ? 0 : gap.width + button_width + (button_width_for(column) + gap.width) * (column - 1);
        return Point.x(x);
    }

	function setup_s_elements() {
        for (let column = 1; column <= columns_inRow(row); column++) {
            const es_tool = ux.s_element_for(new Identifiable(column), T_Element.tool, column);
            es_tool.set_forHovering(colors.default, 'pointer');
            s_element_byRowColumn[column] = es_tool;
        }
	}

    function intercept_closure(s_mouse: S_Mouse, column: number) {
        const s_element = s_element_byRowColumn[column];
        if (!!s_element && s_mouse.isHover) {
            s_element.isOut = s_mouse.isOut;
        }
        closure(s_mouse, column);
    }

</script>

<div class='buttons-grid'
    style='
        top:0px;
        left:1px;
        width: {width}px;
        position:absolute;
        height: {(rows * button_height) + ((rows - 1) * gap.height)}px;'>
    {#each button_titles as titles, column}
        {#if column == 0}
            <div
                class='button-title'
                style='
                    position:absolute;
                    text-align: right;
                    font-size:{font_size + 1}px;
                    width:{button_width_for(column)}px;
                    top:{button_origin_for(column).y}px;
                    left:{button_origin_for(column).x}px;'>
                {title}
            </div>
        {:else}
            <Button
                font_size={font_size}
                height={button_height}
                name={`button-${column}`}
                width={button_width_for(column)}
                origin={button_origin_for(column)}
                es_button={s_element_byRowColumn[column]}
                closure={(s_mouse) => intercept_closure(s_mouse, column)}>
                {title}
            </Button>
        {/if}
    {/each}
</div>
