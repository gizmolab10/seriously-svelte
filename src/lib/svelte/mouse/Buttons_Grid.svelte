<script lang='ts'>
    import { k, ux, Size, Point, colors, T_Tool, T_Element, S_Element } from '../../ts/common/Global_Imports';
    import { w_background_color } from '../../ts/common/Stores';
    import Button from './Button.svelte';
    export let width: number;
    export let columns: number;
    export let font_size: number;
    export let ancestry: Ancestry;
    export let button_height = 15;
    export let gap = new Size(2, 3);
    export let button_titles: string[][];
    export let closure: (s_mouse: S_Mouse, row: number, column: number) => void;
	const s_element_byRowColumn: { [key: string]: S_Element } = {};
    const rows = button_titles.length;    // first dimension of button_titles

    reset_all_s_elements_for_ancestry_change();
    function key_for(row: number, column: number): string { return `${row},${column}`; }
    function columns_inRow(row: number): number { return button_titles[row].length - 1; }

    function button_width_for(row: number, column: number): number {
        if (column != 0) {
            return Math.floor((width - 44 - gap.width) / columns_inRow(row));
        }
        return 34;
	}

    function button_origin_for(row: number, column: number): Point {
        let button_width = 36;
        const y = row * (button_height + gap.height);
        let x = (column == 0) ? 0 : gap.width + button_width + (button_width_for(row, column) + gap.width) * (column - 1);
        return new Point(x, y);
    }

	function reset_all_s_elements_for_ancestry_change() {
		if (!!ancestry) {
            for (let row = 0; row < rows; row++) {
                for (let column = 1; column <= columns_inRow(row); column++) {
                    const key = key_for(row, column);
                    const es_tool = ux.s_element_for(ancestry, T_Element.tool, key);
                    es_tool.set_forHovering(colors.default, 'pointer');
                    s_element_byRowColumn[key] = es_tool;
                }
            }
        }
	}

    function intercept_closure(s_mouse: S_Mouse, row: number, column: number) {
        closure(s_mouse, row, column);
    }

</script>

<div class='buttons-grid'
    style='
        top:0px;
        left:1px;
        width: {width}px;
        position:absolute;
        height: {(rows * button_height) + ((rows - 1) * gap.height)}px;'>
    {#each button_titles as titles, row}
        {#each titles as title, column}
            {#if column == 0}
                <div
                    class='button-title'
                    style='
                        position:absolute;
                        text-align: right;
                        font-size:{font_size + 1}px;
                        width:{button_width_for(row, column)}px;
                        top:{button_origin_for(row, column).y}px;
                        left:{button_origin_for(row, column).x}px;'>
                    {title}
                </div>
            {:else}
                <Button
                    font_size={font_size}
                    height={button_height}
                    width={button_width_for(row, column)}
                    origin={button_origin_for(row, column)}
                    es_button={s_element_byRowColumn[key_for(row, column)]}
                    closure={(s_mouse) => intercept_closure(s_mouse, row, column - 1)}>
                    {title}
                </Button>
            {/if}
        {/each}
    {/each}
</div>
