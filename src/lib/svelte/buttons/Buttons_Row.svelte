<script lang='ts'>
    import { k, u, ux, Point, colors, signals, E_Request, E_Element, S_Element } from '../../ts/common/Global_Imports';
    import { w_count_button_restyle } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Separator from '../kit/Separator.svelte';
    import Button from './Button.svelte';
	import { onMount } from 'svelte';
    export let closure: (e_request: E_Request, s_mouse: S_Mouse, column: number) => boolean;
    export let titles_are_separated = true;
	export let origin: Point | null = null;
    export let row_titles: Array<string>;
    export let font_sizes: Array<number>;
    export let horizontal_gap = 2;
    export let button_height = 15;
    export let font_size: number;
    export let show_box = false;
	export let name = k.empty;
    export let width: number;
    const title_width = 34;
    const button_titles = titles_are_separated ? row_titles.slice(1) : row_titles;
    const columns = button_titles.length;
    const title_widths = button_titles.map((title) => u.getWidth_ofString_withSize(title, `${font_sizes[0]}px`));
    const total_width = title_widths.reduce((acc, width) => acc + width + horizontal_gap, 0);
	const es_button_byColumn: { [key: number]: S_Element } = {};
    const button_portion = (width - total_width - horizontal_gap - (show_box ? 0 : 36)) / columns;
    let row_title = button_titles[0];
    
    update_es_buttons();

    onMount(() => {
        const handle_tool_update = signals.handle_tool_update(0, () => {
            update_es_buttons();
        });
        return () => {
            handle_tool_update.disconnect();
        };
    });

    function button_left_for(column: number): number { return title_widths.slice(0, column).reduce((acc, width) => acc + horizontal_gap + width + button_portion, horizontal_gap / 2); }
    function button_disabled_for(column: number): boolean { return closure(E_Request.query_disabled, null, column); }
    function button_inverted_for(column: number): boolean { return closure(E_Request.query_inverted, null, column); }
    function button_name_for(column: number): string { return closure(E_Request.query_name, null, column); }
    function button_width_for(column: number): number { return button_portion + title_widths[column]; }

	function update_es_buttons() {
        for (let column = 0; column < columns; column++) {
            let es_button = es_button_byColumn[column];
            if (!es_button) {
                es_button = ux.s_element_for(new Identifiable(`${name}-${button_name_for(column)}`), E_Element.button, column);
                es_button_byColumn[column] = es_button;
            }
            es_button.set_forHovering(colors.default, 'pointer');
            es_button.isDisabled = button_disabled_for(column);
            es_button.isInverted = button_inverted_for(column);
        }
	}

</script>

<div class='buttons-row'
    style='
        width:{width}px;
        top:{origin.y}px;
        position:absolute;
        height:{button_height}px;'>
    {#if titles_are_separated}
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
                    font-size:{font_sizes[0]}px;
                    width:{title_width - horizontal_gap}px;'>
                {row_titles[0]}
            </div>
        {/if}
    {/if}
    <div class='buttons-array'
        style='
            width:{width}px;
            position:absolute;
            height:{button_height}px;
            top:{show_box ? 12 : 0}px;
            left:{show_box ? 0 : 36}px;'>
        {#each button_titles as title, column}
            <Button
                height={button_height}
                font_size={font_sizes[1]}
                width={button_width_for(column)}
                es_button={es_button_byColumn[column]}
                origin={Point.x(button_left_for(column))}
                name={`${name}-${button_name_for(column)}`}
                closure={(s_mouse) => closure(E_Request.handle_click, s_mouse, column)}>
                {title}
            </Button>
        {/each}
    </div>
</div>
