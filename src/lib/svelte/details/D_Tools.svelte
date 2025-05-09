<script lang='ts'>
	import { T_Tool, T_Layer, T_Request, T_Predicate, T_Alteration } from '../../ts/common/Global_Imports';
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

	// buttons row sends column & T_Request:
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

	function name_for(t_tool: number, column: number) {
		const titles = button_titles[t_tool];
		return `${titles[0]} ${titles[column]}`;
	}

	function update_button_titles() {
		ancestry = $w_hierarchy.grabs_latest_upward(true);
		list_title = ancestry.isExpanded && layout.inTreeMode ? 'conceal' : 'reveal';
		button_titles = compute_button_titles();
		signals.signal_tool_update();
	}

	function target_ofAlteration(): string | null {
		const s_alteration = $w_s_alteration;
		const kind_ofAPredicate = s_alteration?.predicate?.kind;
		return kind_ofAPredicate == T_Predicate.contains ? 'parent' : kind_ofAPredicate == T_Predicate.isRelated ? 'related' : null;
	}

	function name_ofToolAt(t_tool: number, column: number): string { return Object.keys(k.tools[T_Tool[t_tool]])[column]; }

	function isTool_invertedAt(t_tool: number, column: number): boolean {
		const action = target_ofAlteration();
		const s_alteration = $w_s_alteration;
		const t_alteration = s_alteration?.t_alteration;
		return !!t_alteration && !!action && action == name_ofToolAt(t_tool, column)
			&& ((t_tool == T_Tool.add    && t_alteration == T_Alteration.add)
			||  (t_tool == T_Tool.delete && t_alteration == T_Alteration.delete));
	}

	function tool_closure(t_request: T_Request, s_mouse: S_Mouse, t_tool: number, column: number): any {
		switch (t_request) {
			case T_Request.query_name:
				return name_ofToolAt(t_tool, column);
			case T_Request.query_disabled:
				return $w_hierarchy.isTool_disabledAt(t_tool, column);
			case T_Request.query_inverted:
				return !$w_s_alteration ? false : isTool_invertedAt(t_tool, column);
			case T_Request.query_visibility:
				return !$w_s_alteration ? true : [T_Tool.add, T_Tool.delete].includes(t_tool);
			case T_Request.handle_click:
				if (s_mouse.isDown) {
					return $w_hierarchy.handle_tool_clickedAt(t_tool, column, s_mouse, name_for(t_tool, column + 1));
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
		z-index:{T_Layer.tools}'>
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
					z-index:{T_Layer.tools + 1};
					font-size:{k.font_size.smallest}px;'>
				To <em>{$w_s_alteration.t_alteration}</em> an item <em>{target_ofAlteration() ?? k.unknown}</em>
				<br> to <strong>{ancestry.title}</strong>
				<br> choose the item's <em>blinking</em> dot
				<br><br> When you are <em>done</em>,
				<br> click any enabled button (above)
			</div>
		{/if}
    {/key}
</div>
