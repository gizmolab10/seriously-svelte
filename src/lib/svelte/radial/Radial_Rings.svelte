<script lang='ts'>
	import { e, g, k, s, x, hits, busy, debug, colors, radial, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Radial_Zone, T_Hit_Target, S_Component } from '../../ts/common/Global_Imports';
	import { Thing, Point, Angle, g_radial, databases } from '../../ts/common/Global_Imports';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Radial_Cluster from './Radial_Cluster.svelte';
	import { onMount } from 'svelte';
	const name = 'rings';
	const { w_s_hover } = hits;
	const { w_thing_color } = colors;
	const ring_width = k.thickness.radial.ring;
	const { w_g_cluster, w_rotate_angle, w_resize_radius } = radial;
	const { w_count_mouse_up, w_s_title_edit, w_ancestry_focus } = s;
	let color = $w_ancestry_focus?.thing?.color ?? colors.default_forThings;
	let rotate_element: HTMLElement | null = null;
	let resize_element: HTMLElement | null = null;
	let mouse_up_count = $w_count_mouse_up;
	let resize_fill = 'transparent';
	let rotate_fill = 'transparent';
	let s_component: S_Component;
	let reattachments = 0;

	$: outer_diameter  = outer_radius * 2;
	$: outer_radius	   = middle_radius;// + ring_width;
	$: middle_radius   = $w_resize_radius + ring_width;
	$: reticle_svgPath = debug.reticle ? reticle_path() : '';
	$: viewBox		   = `${-ring_width}, ${-ring_width}, ${outer_diameter}, ${outer_diameter}`;
	$: resize_svgPath  = svgPaths.circle(Point.square($w_resize_radius), $w_resize_radius - 0.3, true);
	$: rotate_svgPath  = svgPaths.annulus(Point.square($w_resize_radius), middle_radius, ring_width);

	s_component = signals.handle_reposition_widgets_atPriority(2, null, T_Hit_Target.rings, (received_ancestry) => {
		reattachments += 1;
	});

	onMount(() => {
		update_fill_colors();
		return () => s_component.disconnect();
	});

	$: {
		if (!!resize_element) {
			radial.s_resizing.set_html_element(resize_element);
		}
	}

	$: {
		if (!!rotate_element) {
			radial.s_rotation.set_html_element(rotate_element);
		}
	}

	$: {
		if (!!$w_s_hover) {
			setTimeout(() => {
				update_fill_colors();
			}, 100);
		}
	}
		
	$: {
		const thing = $w_ancestry_focus?.thing;	
		if (!!thing && thing.id == $w_thing_color?.split(k.separator.generic)[0]) {
			color = thing.color ?? colors.default_forThings;
		}
	}

	$: {
		if (mouse_up_count != $w_count_mouse_up) {
			mouse_up_count = $w_count_mouse_up;
			s_reset();			// mouse up ... end all (rotation, resizing, paging)
		}
	}

	function update_fill_colors() {
		resize_fill	= radial.s_resizing.fill_color;
		rotate_fill	= radial.s_rotation.fill_color;
	}

	function s_reset() {
		radial.reset();
		e.mouse_timer_forName(name).reset();
		update_fill_colors();
	}

	function handle_s_mouse(s_mouse) {

		/////////////////////////////
		// setup or teardown state //
		/////////////////////////////

		if (s_mouse.isUp) {
			s_reset();
		} else if (s_mouse.isDown) {
			const angle_ofMouseDown = g.mouse_angle_fromGraphCenter;
			const angle_ofRotation = angle_ofMouseDown.add_angle_normalized(-$w_rotate_angle);
			const zone = radial.ring_zone_atMouseLocation;
			$w_s_title_edit?.stop_editing();
			$w_s_title_edit = null;		// so widget will react
			switch (zone) {
				case T_Radial_Zone.rotate:
					debug.log_radial(` begin rotate  ${angle_ofRotation.asDegrees()}`);
					radial.s_rotation.active_angle = angle_ofMouseDown;
					radial.s_rotation.basis_angle = angle_ofRotation;
					break;
				case T_Radial_Zone.resize:
					const change_ofRadius = g.mouse_distance_fromGraphCenter - $w_resize_radius;
					debug.log_radial(` begin resize  ${change_ofRadius.asInt()}`);
					radial.s_rotation.active_angle = angle_ofMouseDown + Angle.quarter;	// needed for cursor
					radial.s_rotation.basis_angle = angle_ofRotation + Angle.quarter;		// "
					radial.s_resizing.basis_radius = change_ofRadius;
					break;
				case T_Radial_Zone.paging: 
					const angle_ofPage = angle_ofMouseDown.angle_normalized();
					const g_cluster = g_radial.g_cluster_atMouseLocation;
					if (!!g_cluster) {
						debug.log_radial(` begin paging  ${angle_ofPage.asDegrees()}`);
						g_cluster.s_paging.active_angle = angle_ofPage;
						g_cluster.s_paging.basis_angle = angle_ofPage;
						$w_g_cluster = g_cluster;
					}
					break;
			}
		}
		radial.cursor = radial.cursor_forRingZone;
	}

	function reticle_path(): string {
		const center = $w_resize_radius;
		const start = -ring_width;
		const end = outer_diameter - ring_width;
		return `M ${start} ${center} L ${end} ${center} M ${center} ${start} L ${center} ${end}`;
	}

</script>

{#key reattachments}
	{#if !debug.hide_rings}
		<div class = 'rings'
			id = {s_component.id}
			style = '
				user-select: none;
				-ms-user-select: none;
				-moz-user-select: none;
				z-index:{T_Layer.ring};
				-webkit-user-select: none;'>
			<Mouse_Responder name = 'rings'
				cursor = {radial.cursor}
				width = {outer_diameter}
				height = {outer_diameter}
				zindex = {T_Layer.ring}
				center = {g.center_ofGraphView}
				handle_s_mouse = {handle_s_mouse}>
				<svg class = 'rings-svg'
					viewBox = {viewBox}>
					<path class = 'resize-path'
						fill = {resize_fill}
						d = {resize_svgPath}
						bind:this = {resize_element}/>
					{#if debug.reticle}
						<path class = 'reticle-path'
							stroke = 'green'
							fill = 'transparent'
							d = {reticle_svgPath}/>
					{/if}
					<path class = 'rotate-path'
						fill = {rotate_fill}
						d = {rotate_svgPath}
						bind:this = {rotate_element}/>
				</svg>
			</Mouse_Responder>
		</div>
	{/if}
	<div class = 'paging-arcs'
		style = '
			z-index:{T_Layer.paging};
			background-color: transparent;'>
		{#each g_radial.g_clusters as g_cluster}
			{#if !!g_cluster && (g_cluster.widgets_shown > 0)}
				<Radial_Cluster
					color = {color}
					g_cluster = {g_cluster}/>
			{/if}
		{/each}
	</div>
{/key}
