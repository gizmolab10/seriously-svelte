<script lang='ts'>
	import { c, k, p, u, ux, w, show, Point, colors, layout, svgPaths, signals, S_Element } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Graph, T_Banner, T_Element, T_Control, T_Kinship, T_Preference } from '../../ts/common/Global_Imports';
	import { w_show_details, w_show_related, w_show_graph_ofType, w_show_tree_ofType } from '../../ts/common/Stores';
	import { w_graph_rect, w_count_resize, w_hierarchy, w_popupView_id } from '../../ts/common/Stores';
	import { w_background_color, w_device_isMobile, w_thing_fontFamily } from '../../ts/common/Stores';
	import Identifiable from '../../ts/runtime/Identifiable';
	import Segmented from '../mouse/Segmented.svelte';
	import Button from '../buttons/Button.svelte';
	import SVG_D3 from '../kit/SVG_D3.svelte';
	import { onMount } from 'svelte';
	const details_top = k.height.dot / 2;
	const y_center = details_top + 3.5;
	const size_small = k.height.button;
	const size_big = size_small + 4;
	const lefts = [10, 55, 117, 278];
	const resize_viewBox = `0, 0, ${size_big}, ${size_big}`;
	let es_control_byType: { [t_control: string]: S_Element } = {};
	let isVisible_forType: {[t_control: string]: boolean} = {};
	let related_prefix = $w_show_related ? 'hide' : 'show'
	let width = w.windowSize.width - 20;
	let displayName = k.empty;
	let displayName_width = 0;
	let displayName_x = 220;

	const t_controls = [	// in order of importance on mobile
		T_Control.details,
		T_Control.related,
		T_Control.smaller,
		T_Control.bigger,
		T_Control.help,
		T_Control.builds,
	];

	onMount(() => { setup_forIDs(); });
	function togglePopupID(id) { $w_popupView_id = ($w_popupView_id == id) ? null : id; }

	$: $w_count_resize, $w_graph_rect, width = w.windowSize.width - 20;

	$: {
		const show_related = $w_show_related;
		related_prefix = show_related ? 'hide' : 'show'
		const es_related = es_control_byType[T_Control.related];
		if (es_related) {
			es_related.isSelected = show_related;
		}
	}

	$: {
		const _ = $w_show_graph_ofType;
		const db = $w_hierarchy.db;
		if (!!db) {
			const extra = layout.inTreeMode ? 84 : 0;
			displayName = db.displayName;
			displayName_width = u.getWidthOf(displayName);
			displayName_x = extra + (width - displayName_width) / 2;
		}
	}

	function setup_forIDs() {
		let total = w.windowSize.width + 50;
		for (const t_control of t_controls) {
			total -= u.getWidthOf(t_control);
			const es_control = ux.s_element_for(new Identifiable(t_control), T_Element.control, t_control);
			es_control.ignore_hover = [T_Control.details, T_Control.related].includes(t_control);
			es_control.isSelected = (t_control == T_Control.related) && $w_show_related;
			es_control.set_forHovering(colors.default, 'pointer');
			es_control_byType[t_control] = es_control;
			isVisible_forType[t_control] = total > 0;
		}
	}

	function handle_s_mouse_forControl_Type(s_mouse, t_control) {
		if (s_mouse.isHover) {
			es_control_byType[t_control].isOut = s_mouse.isOut;
		} else if (s_mouse.isUp) {
			switch (t_control) {
				case T_Control.help: c.showHelp(); break;
				case T_Control.details: $w_show_details = !$w_show_details; break;
				case T_Control.related: $w_show_related = !$w_show_related; break;
				case T_Control.bigger: width = w.zoomBy(k.ratio.zoom_in) - 20; break;	// mobile only
				case T_Control.smaller: width = w.zoomBy(k.ratio.zoom_out) - 20; break;	//   "     "
				default: togglePopupID(t_control); break;
			}
		}
	}

</script>

{#if Object.values(es_control_byType).length > 0}
	{#key width}
		<div id='controls'
			style='
				top: 0.7px;
				left: 0px;
				position: absolute;
				z-index: {T_Layer.frontmost};
				height: `${layout.height_ofBannerAt(T_Banner.controls) - 2}px`;'>
			{#if !$w_popupView_id}
				{#key $w_background_color}
					<Button
						name='details-toggle'
						border_thickness=0
						color='transparent'
						center={new Point(lefts[0], details_top + 3)}
						es_button={es_control_byType[T_Control.details]}
						closure={(s_mouse) => handle_s_mouse_forControl_Type(s_mouse, T_Control.details)}>
						<img src='settings.svg' alt='circular button' width={size_small}px height={size_small}px/>
					</Button>
				{/key}
				{#key $w_show_graph_ofType}
					<Segmented
						origin={Point.x(30)}
						selected={[$w_show_graph_ofType]}
						name='graph-type-selector'
						titles={[T_Graph.tree, T_Graph.radial]}
						selection_closure={(titles) => layout.handle_mode_selection('graph', titles)}/>
					{#if layout.inTreeMode}
						{#key $w_show_tree_ofType}
							<Segmented
								origin={Point.x(110)}
								allow_multiple={true}
								name='tree-type-selector'
								selected={$w_show_tree_ofType}
								titles={[T_Kinship.child, T_Kinship.parent, T_Kinship.related, T_Kinship.tags]}
								selection_closure={(titles) => layout.handle_mode_selection('tree', titles)}/>
						{/key}
					{/if}
				{/key}
				{#key displayName}
					<div style='
						width:{displayName_width + 20}px;
						left:{displayName_x}px;
						position:absolute;'>
						{displayName}
					</div>
				{/key}
			{/if}
			{#key $w_device_isMobile}
				{#if $w_device_isMobile}
					{#if isVisible_forType[T_Control.smaller]}
						<Button
							width={size_big}
							height={size_big}
							name={T_Control.smaller}
							center={new Point(width - 110, y_center)}
							es_button={es_control_byType[T_Control.smaller]}
							closure={(s_mouse) => handle_s_mouse_forControl_Type(s_mouse, T_Control.smaller)}>
							<svg
								id='shrink-svg'>
								<path
									stroke=colors.default
									fill=transparent
									id='shrink-path'
									d={svgPaths.dash(size_big, 2)}/>
							</svg>
						</Button>
					{/if}
					{#if isVisible_forType[T_Control.bigger]}
						<Button
							width={size_big}
							height={size_big}
							name={T_Control.bigger}
							center={new Point(width - 140, y_center)}
							es_button={es_control_byType[T_Control.bigger]}
							closure={(s_mouse) => handle_s_mouse_forControl_Type(s_mouse, T_Control.bigger)}>
							<svg
								id='enlarge-svg'>
								<path
									stroke=colors.default
									fill=transparent
									id='enlarge-path'
									d={svgPaths.t_cross(size_big, 2)}/>
							</svg>
						</Button>
					{/if}
				{/if}
			{/key}
			{#key $w_background_color}
				<Button name={T_Control.builds}
					width=75
					height={size_big}
					center={new Point(width - 55, y_center)}
					es_button={es_control_byType[T_Control.builds]}
					closure={(s_mouse) => handle_s_mouse_forControl_Type(s_mouse, T_Control.builds)}>
					<span style='font-family: {$w_thing_fontFamily};'>
						{'build ' + k.build_number}
					</span>
				</Button>
				<Button name={T_Control.help}
					width={size_big}
					height={size_big}
					center={new Point(width, y_center)}
					es_button={es_control_byType[T_Control.help]}
					closure={(s_mouse) => handle_s_mouse_forControl_Type(s_mouse, T_Control.help)}>
					<span
						style='top:2px;
							left:5.5px;
							position:absolute;'>
						?
					</span>
				</Button>
			{/key}
		</div>
	{/key}
{/if}