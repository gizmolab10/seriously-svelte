<script lang='ts'>
	import { k, u, ux, Point, colors, signals, T_Request, T_Element, S_Element } from '../../ts/common/Global_Imports';
	import { w_show_info_ofType, w_count_button_restyle } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Separator from '../kit/Separator.svelte';
	import Button from './Button.svelte';
	import { onMount } from 'svelte';
	export let closure: (t_request: T_Request, s_mouse: S_Mouse, column: number) => boolean;
	export let separator_thickness = k.thickness.separator.thick;
	export let origin: Point | null = null;
	export let center: Point | null = null;
	export let row_titles: Array<string>;	// first one is optional row title, rest are button titles
	export let font_sizes: Array<number>;
	export let horizontal_gap = 2;
	export let button_height = 13;
	export let align_left = true;
	export let add_wings = true;
	export let has_title = true;	// true means first row_titles is the title of the row
	export let show_box = false;
	export let name = k.empty;
	export let width: number;
	export let margin = 0;
	const solo_title_width = 34;
	const button_titles = has_title ? row_titles.slice(1) : row_titles;
	const title_widths = button_titles.map((title) => u.getWidth_ofString_withSize(title, `${font_sizes[0]}px`));
	const total_width = title_widths.reduce((acc, width) => acc + width + horizontal_gap, 0);
	const es_button_byColumn: { [key: number]: S_Element } = {};
	const columns = button_titles.length;
	const button_portion = (width - (margin * 2) - total_width - horizontal_gap - (show_box ? 0 : solo_title_width)) / columns;
	const row_title = row_titles[0];
	let reattachments = 0;
	let style = k.empty;

	//////////////////////////////////////////////////////////////
	//			 one row of buttons, plus options				//
	//															//
	//	has_title:		true means first one is row title		//
	//	show_box:		true means line through row title		//
	//															//
	//	row_titles		no buttons: if only one and has title	//
	//	font_sizes:		[title_font_size, button_font_size] 	//
	//	horizontal_gap:	between buttons							//
	//															//
	//////////////////////////////////////////////////////////////

    update_es_buttons();
	$: $w_show_info_ofType, update_es_buttons();

	onMount(() => {
		const handle_tool_update = signals.handle_tool_update(0, () => {
			update_es_buttons();
		});
		return () => {
			handle_tool_update.disconnect();
		};
	});

	function button_left_for(column: number): number { return title_widths.slice(0, column).reduce((acc, width) => acc + horizontal_gap + width + button_portion, horizontal_gap / 2); }
	function button_disabled_for(column: number): boolean { return closure(T_Request.is_disabled, null, column); }
	function button_inverted_for(column: number): boolean { return closure(T_Request.is_inverted, null, column); }
	function button_name_for(column: number): string { return closure(T_Request.name, null, column); }
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
		{#if show_box}
			<Separator
				length={width}
				title={row_title}
				add_wings={add_wings}
				thickness={separator_thickness}
				title_font_size={font_sizes[0]}
				title_left={k.separator_title_left}/>
		{:else}
			<div
				class='box-title'
				style='
					top: 1.5px;
					left:{margin}px;
					text-align: right;
					position:absolute;
					font-size:{font_sizes[0]}px;
					width:{solo_title_width - horizontal_gap}px;'>
				{row_title}
			</div>
		{/if}
	{/if}
	{#key reattachments}
		{#if button_titles.length > 0}
			<div class='buttons-array'
				style='
					position:absolute;
					top:{show_box ? 9 : 0}px;
					left:{margin + (show_box ? 0 : solo_title_width)}px;'>
				{#each button_titles as title, column}
					<Button
						height={button_height}
						font_size={font_sizes[1]}
						width={button_width_for(column)}
						es_button={es_button_byColumn[column]}
						origin={Point.x(button_left_for(column))}
						name={`${name}-${button_name_for(column)}`}
						closure={(s_mouse) => closure(T_Request.handle_click, s_mouse, column)}>
						{title}
					</Button>
				{/each}
			</div>
		{/if}
	{/key}
</div>
