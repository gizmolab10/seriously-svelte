<script lang='ts'>
    import { k, u, ux, Point, colors, signals, T_Request, T_Element, S_Element } from '../../ts/common/Global_Imports';
    import { w_count_button_restyle } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
    import Button from './Button.svelte';
	import { onMount } from 'svelte';
    export let closure: (t_request: T_Request, s_mouse: S_Mouse, column: number) => boolean;
	export let origin: Point | null = null;
    export let button_titles: string[];
    export let button_height = 15;
    export let font_size: number;
	export let name = k.empty;
    export let width: number;
    export let gap = 2;
    const title_width = 34;
    const columns = button_titles.length;
    const button_width = Math.floor((width + 2) / columns) - gap;
    const title_widths = button_titles.map((title) => u.getWidth_ofString_withSize(title, `${font_size}px`));
    const total_width = title_widths.reduce((acc, width) => acc + width + gap, 0);
	const es_button_byColumn: { [key: number]: S_Element } = {};
    const button_portion = (width - total_width) / columns;
    
    update_es_buttons();

    onMount(() => {
        const handle_tool_update = signals.handle_tool_update(0, () => {
            update_es_buttons();
        });
        return () => {
            handle_tool_update.disconnect();
        };
    });

    function button_left_for(column: number): number { return title_widths.slice(0, column).reduce((acc, width) => acc + gap + width + button_portion, 0); }
    function button_disabled_for(column: number): boolean { return closure(T_Request.query_disabled, null, column); }
    function button_inverted_for(column: number): boolean { return closure(T_Request.query_inverted, null, column); }
    function button_name_for(column: number): string { return closure(T_Request.query_name, null, column); }
    function button_width_for(column: number): number { return button_portion + title_widths[column]; }

	function update_es_buttons() {
        for (let column = 0; column < columns; column++) {
            let es_button = es_button_byColumn[column];
            if (!es_button) {
                es_button = ux.s_element_for(new Identifiable(`${name}-${button_name_for(column)}`), T_Element.button, column);
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
        left:{origin.x}px;
        position:absolute;
        height: {button_height}px;'>
    {#each button_titles as title, column}
        <Button
            font_size={font_size}
            height={button_height}
            width={button_width_for(column)}
            es_button={es_button_byColumn[column]}
            origin={Point.x(button_left_for(column))}
            name={`${name}-${button_name_for(column)}`}
            closure={(s_mouse) => closure(T_Request.handle_click, s_mouse, column)}>
            {title}
        </Button>
    {/each}
</div>
