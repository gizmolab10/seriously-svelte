<script lang='ts'>
	import { k, u, ux, Point, colors, S_Element, T_Element, T_Request } from '../../ts/common/Global_Imports';
	import { w_count_button_restyle } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
    import G_Repeater from '../../ts/layout/G_Repeater';
	import Separator from '../kit/Separator.svelte';
	import Button from './Button.svelte';
	export let closure: (t_request: T_Request, s_mouse: S_Mouse, column: number) => boolean;
	export let separator_thickness = k.thickness.separator.thick;
	export let origin: Point | null = null;
	export let center: Point | null = null;
    export let type = T_Element.button;
	export let has_seperator = false;
	export let row_titles: string[];	// first one is optional row title, rest are button titles
	export let font_sizes: number[];
	export let button_height = 13;
	export let align_left = true;
	export let add_wings = true;
	export let has_title = true;	// true means first row_titles is the title of the row
	export let name = k.empty;
	export let title_gap = 8;
	export let width: number;
	export let margin = 0;
	export let gap = 1;
	const solo_title_width = 42;
	const front_margin = has_seperator ? 0 : solo_title_width;
	const button_titles = has_title ? row_titles.slice(1) : row_titles;
	const g_repeater = new G_Repeater(button_titles, button_height, width - front_margin, margin, gap, 8, title_gap, true, font_sizes[0]);
	const es_button_byColumn: { [key: number]: S_Element } = {};
	const button_portion = g_repeater.button_portion;
	const columns = button_titles.length;
	const row_title = row_titles[0];
	let reattachments = 0;
	let style = k.empty;

	//////////////////////////////////////////////////////////////
	//			 one row of buttons, plus options				//
	//															//
	//	has_title:		true means first one is row title		//
	//	has_seperator:	true means line through row title		//
	//															//
	//	row_titles		no buttons: if only one and has title	//
	//	font_sizes:		[title_font_size, button_font_size] 	//
	//	gap:			between buttons							//
	//	margin:			at start and end of row					//
	//															//
	//////////////////////////////////////////////////////////////

    update_es_buttons();

	function button_disabled_for(column: number): boolean { return closure(T_Request.is_disabled, null, column); }
	function button_inverted_for(column: number): boolean { return closure(T_Request.is_inverted, null, column); }
	function button_name_for(column: number): string { return closure(T_Request.name, null, column); }

	function update_es_buttons() {
		for (let column = 0; column < columns; column++) {
			let es_button = es_button_byColumn[column];
			if (!es_button) {
				es_button = ux.s_element_for(new Identifiable(`${name}-${button_name_for(column)}`), type, column);
				es_button_byColumn[column] = es_button;
			}
			es_button.set_forHovering(colors.default, 'pointer');
			es_button.isDisabled = button_disabled_for(column);
			es_button.isInverted = button_inverted_for(column);
		}
		if (!!origin || !!center) {
			const x = origin?.x ?? center?.x - width / 2;
			const y = origin?.y ?? center?.y - height / 2;
			const alignment = align_left ? 'left: ' : 'right: ';
			style = `${alignment}${x}px; top: ${y}px;`;
		}
		reattachments += 1;
	}

</script>

<div class='buttons-row'
	style='{style}
		top:{origin.y}px;
		position:absolute;
		height:{button_height}px;
		width:{width - (margin * 2)}px;'>
	{#if has_title}
		{#if has_seperator}
			<Separator
				length={width}
				title={row_title}
				isHorizontal={true}
				add_wings={add_wings}
				has_thin_divider={false}
				thickness={separator_thickness}
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
					width:{solo_title_width - gap - 7}px;'>
				{row_title}
			</div>
		{/if}
	{/if}
	{#key reattachments}
		{#if button_titles.length > 0}
			<div class='buttons-array'
				style='
					position:absolute;
					top:{has_seperator ? 10 : 0}px;
					left:{margin + (has_seperator ? 0 : solo_title_width)}px;'>
				{#each button_titles as title, column}
					<Button
						height={button_height}
						font_size={font_sizes[1]}
						es_button={es_button_byColumn[column]}
						width={g_repeater.button_width_for(column)}
						name={`${name}-${button_name_for(column)}`}
						origin={Point.x(g_repeater.button_left_for(column))}
						closure={(s_mouse) => closure(T_Request.handle_click, s_mouse, column)}>
						{title}
					</Button>
				{/each}
			</div>
		{/if}
	{/key}
</div>
