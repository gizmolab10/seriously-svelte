<script lang='ts'>
	import { E_Tool, E_Layer, E_ToolRequest, E_Predicate, E_Alteration } from '../../ts/common/Global_Imports';
	import { w_hierarchy, w_e_details, w_user_graph_offset, w_s_alteration } from '../../ts/common/Stores';
	import { k, show, Size, Point, signals, layout, S_Mouse } from '../../ts/common/Global_Imports';
	import { w_ancestries_grabbed, w_ancestries_expanded } from '../../ts/common/Stores';
	import Buttons_Grid from '../buttons/Buttons_Grid.svelte';
	import Button from '../buttons/Button.svelte';
	export let top = 0;
	const has_title = true;
	const show_box = show.tool_boxes;
    const font_sizes = [k.font_size.smallest, show_box ? k.font_size.smaller : k.font_size.smallest];
	let ancestry = $w_hierarchy.grabs_latest_upward(true);
	let list_title = ancestry.isExpanded && layout.inTreeMode ? 'conceal' : 'reveal';
	let button_titles = compute_button_titles();
	let tools_top = top + (has_title ? 3 : -13);
    let reattachments = 0;

	// buttons row sends column & E_ToolRequest:
	// 	 is_disabled calls:	isTool_disabledAt
	//	 handle_click calls:	handle_tool_clickedAt ... n.b., long press generates multiple calls
	// buttons grid adds row (here it becomest_tool)
	
    $: top, tools_top = top + (has_title ? 3 : -13);
    $: $w_s_alteration, reattachments += 1;

	$:	$w_e_details,
		$w_user_graph_offset,
		$w_ancestries_grabbed,
		$w_ancestries_expanded,
		update_button_titles();

	function name_ofToolAt(e_tool: number, column: number): string { return Object.keys(k.tools[E_Tool[e_tool]])[column]; }

	function name_for(e_tool: number, column: number) {
		const titles = button_titles[e_tool];
		return `${titles[0]} ${titles[column]}`;
	}

	function target_ofAlteration(): string | null {
		const s_alteration = $w_s_alteration;
		const kind_ofAPredicate = s_alteration?.predicate?.kind;
		return kind_ofAPredicate == E_Predicate.contains ? 'parent' : kind_ofAPredicate == E_Predicate.isRelated ? 'related' : null;
	}

	function update_button_titles() {
		ancestry = $w_hierarchy.grabs_latest_upward(true);
		list_title = ancestry.isExpanded && layout.inTreeMode ? 'conceal' : 'reveal';
		button_titles = compute_button_titles();
		signals.signal_tool_update();
		reattachments += 1;
	}

	function isTool_invertedAt(e_tool: number, column: number): boolean {
		const action = target_ofAlteration();
		const s_alteration = $w_s_alteration;
		const e_alteration = s_alteration?.e_alteration;
		return !!e_alteration && !!action && action == name_ofToolAt(e_tool, column)
			&& ((e_tool == E_Tool.add    && e_alteration == E_Alteration.add)
			||  (e_tool == E_Tool.delete && e_alteration == E_Alteration.delete));
	}

	function compute_button_titles() {
		return [
			['browse', 'up', 'down', 'left', 'right'],
			['add', 'child', 'sibling', 'line', 'parent', 'related'],
			['delete', 'selection', 'parent', 'related'],
			['move', 'up', 'down', 'left', 'right'],
			['list', `${list_title}`],
			['show', 'selection', 'root'],
			['graph', 'center'],
		];
	}

	function tool_closure(e_toolRequest: E_ToolRequest, s_mouse: S_Mouse, e_tool: number, column: number): any {
		const isAltering = !!$w_s_alteration;
		const hierarchy = $w_hierarchy;
		switch (e_toolRequest) {
			case E_ToolRequest.name:
				return name_ofToolAt(e_tool, column);
			case E_ToolRequest.is_disabled:
				return hierarchy.isTool_disabledAt(e_tool, column);
			case E_ToolRequest.is_inverted:
				return !isAltering ? false : isTool_invertedAt(e_tool, column);
			case E_ToolRequest.is_visible:
				return !isAltering ? true : [E_Tool.add, E_Tool.delete].includes(e_tool);
			case E_ToolRequest.handle_click:
				if (s_mouse.isDown) {
					return hierarchy.handle_tool_clickedAt(e_tool, column, s_mouse, name_for(e_tool, column + 1));
				} else if (s_mouse.isLong) {
					// start interval
				} else if (s_mouse.isUp) {
					// stop interval
				}
		}
		return null;
	}

</script>

{#key reattachments}
	<div
		class='tools'
		style='
			top:{tools_top}px;
			position:absolute;
			z-index:{E_Layer.tools}'>
		<Buttons_Grid
			gap={3}
			columns={5}
			name='tools'
			show_box={show_box}
			has_title={has_title}
			closure={tool_closure}
			font_sizes={font_sizes}
			width={k.width_details}
			button_titles={button_titles}
			button_height={k.height.button}/>
		{#if $w_s_alteration}
			<div
				class='alteration-instructions'
				style='
					display:block;
					position:absolute;
					text-align:center;
					width:{k.width_details}px;
					top:{show_box ? 120 : 58}px;
					z-index:{E_Layer.tools + 1};
					font-size:{k.font_size.smallest}px;'>
				To <em>{$w_s_alteration.e_alteration}</em> an item as <em>{target_ofAlteration() ?? k.unknown}</em>
				<br> to <strong>{ancestry.title}</strong>
				<br> choose that item's <em>blinking</em> dot
				<br><br> When you are <em>done</em>,
				<br> click any enabled button (above)
			</div>
		{/if}
	</div>
{/key}
