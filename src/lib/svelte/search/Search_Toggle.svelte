<script lang="ts">
	import { w_search_preferences, w_search_state } from '../../ts/managers/Stores';
	import { T_Search, T_Layer, T_Control } from '../../ts/common/Global_Imports';
	import { e, k, p, u, ux, Point } from '../../ts/common/Global_Imports';
	import { w_show_details } from '../../ts/managers/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Close_Button from '../mouse/Close_Button.svelte';
	import { search } from '../../ts/managers/Search';
	import Button from '../mouse/Button.svelte';
	export let width: number;
	export let left: number;
	export let top: number;
	const size_big = k.height.dot * 1.4;
	const right_widths = [10, 10.5, $w_show_details ? 5 : 86, 73, 60];
	const rights = u.cumulativeSum(right_widths).map((right, index) => width - right);

</script>

<div class='search-controls'
	style='
		top: {top}px;
		left: {left}px;
		position: absolute;
		z-index: {T_Layer.frontmost};'>
	{#if $w_search_state === T_Search.off}
		<Button
			width={size_big - 1}
			height={size_big - 1}
			border_thickness={0.1}
			name={T_Control.search}
			center={new Point(rights[0], 11)}
			s_button={ux.s_control_forType(T_Control.search)}
			closure={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.search)}>
			🔍
		</Button>
	{:else}
		<Close_Button
			name='end-search'
			align_left={true}
			size={size_big + 1}
			stroke_width={0.25}
			closure={() => search.deactivate()}
			origin={new Point(rights[1], 0.5)}/>
	{/if}
</div>
