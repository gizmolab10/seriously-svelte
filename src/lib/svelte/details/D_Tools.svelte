<script lang='ts'>
	import { E_Tool, E_Layer, E_Request, E_Predicate, E_Alteration } from '../../ts/common/Global_Imports';
	import { w_hierarchy, w_user_graph_offset, w_s_alteration } from '../../ts/common/Stores';
	import { k, show, Size, Point, signals, layout, S_Mouse } from '../../ts/common/Global_Imports';
	import { w_ancestries_grabbed, w_ancestries_expanded } from '../../ts/common/Stores';
	import Buttons_Grid from '../buttons/Buttons_Grid.svelte';
	import Button from '../buttons/Button.svelte';
	export let top = 0;
	const titles_are_separated = true;
	const show_separators = show.tool_separators;
	const tools_top = top + (titles_are_separated ? 1 : -13);
    const font_sizes = [k.font_size.smallest, show_separators ? k.font_size.smaller : k.font_size.smallest];
	let ancestry = $w_hierarchy.grabs_latest_upward(true);
	let list_title = ancestry.isExpanded && layout.inTreeMode ? 'conceal' : 'reveal';
	let button_titles = compute_button_titles;
    let reattachments = 0;

	// buttons row sends column & E_Request:
	// 	query_disabled		isTool_disabledAt
	//	handle_click		handle_tool_clickedA ... n.b., long press generates multiple calls
	// buttons grid adds row (here it becomest_tool)

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
	
    $: $w_s_alteration, reattachments += 1;

	$:	$w_user_graph_offset,
		$w_ancestries_grabbed,
		$w_ancestries_expanded,
		update_button_titles();

	function name_for(e_tool: number, column: number) {
		const titles = button_titles[e_tool];
		return `${titles[0]} ${titles[column]}`;
	}

	function update_button_titles() {
		ancestry = $w_hierarchy.grabs_latest_upward(true);
		list_title = ancestry.isExpanded && layout.inTreeMode ? 'conceal' : 'reveal';
		button_titles = compute_button_titles();
		signals.signal_tool_update();
		reattachments += 1;
	}

	function target_ofAlteration(): string | null {
		const s_alteration = $w_s_alteration;
		const kind_ofAPredicate = s_alteration?.predicate?.kind;
		return kind_ofAPredicate == E_Predicate.contains ? 'parent' : kind_ofAPredicate == E_Predicate.isRelated ? 'related' : null;
	}

	function name_ofToolAt(e_tool: number, column: number): string { return Object.keys(k.tools[E_Tool[e_tool]])[column]; }

	function isTool_invertedAt(e_tool: number, column: number): boolean {
		const action = target_ofAlteration();
		const s_alteration = $w_s_alteration;
		const e_alteration = s_alteration?.e_alteration;
		return !!e_alteration && !!action && action == name_ofToolAt(e_tool, column)
			&& ((e_tool == E_Tool.add    && e_alteration == E_Alteration.add)
			||  (e_tool == E_Tool.delete && e_alteration == E_Alteration.delete));
	}

	function tool_closure(e_request: E_Request, s_mouse: S_Mouse, e_tool: number, column: number): any {
		switch (e_request) {
			case E_Request.query_name:
				return name_ofToolAt(e_tool, column);
			case E_Request.query_disabled:
				return $w_hierarchy.isTool_disabledAt(e_tool, column);
			case E_Request.query_inverted:
				return !$w_s_alteration ? false : isTool_invertedAt(e_tool, column);
			case E_Request.query_visibility:
				return !$w_s_alteration ? true : [E_Tool.add, E_Tool.delete].includes(e_tool);
			case E_Request.handle_click:
				if (s_mouse.isDown) {
					return $w_hierarchy.handle_tool_clickedAt(e_tool, column, s_mouse, name_for(e_tool, column + 1));
				}
		}
		return null;
	}

</script>

<div
	class='tools'
	style='
		top:{tools_top}px;
		position:absolute;
		z-index:{E_Layer.tools}'>
    {#key reattachments}
		<Buttons_Grid
			gap={3}
			columns={5}
			name='tools'
			closure={tool_closure}
			font_sizes={font_sizes}
			show_separators={show_separators}
			width={k.width_details}
			button_titles={button_titles}
			button_height={k.height.button}
			titles_are_separated={titles_are_separated}/>
		{#if $w_s_alteration}
			<div
				class='alteration-instructions'
				style='
					top:120px;
					display:block;
					position:absolute;
					text-align:center;
					width:{k.width_details}px;
					z-index:{E_Layer.tools + 1};
					font-size:{k.font_size.smallest}px;'>
				To <em>{$w_s_alteration.e_alteration}</em> an item as <em>{target_ofAlteration() ?? k.unknown}</em>
				<br> to <strong>{ancestry.title}</strong>
				<br> choose the item's <em>blinking</em> dot
				<br><br> When you are <em>done</em>,
				<br> click any enabled button (above)
			</div>
		{/if}
    {/key}
</div>
