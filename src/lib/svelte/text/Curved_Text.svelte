<script lang='ts'>
	import { T_Layer, T_Orientation } from '../../ts/common/Global_Imports';
	import { k, s, Angle, Point } from '../../ts/common/Global_Imports';
	import Cluster_Pager from '../mouse/Cluster_Pager.svelte';
	export let background_color = $w_background_color;
	export let font_family = $w_thing_fontFamily;
	export let center_ofArc = Point.zero;
	export let zindex = T_Layer.text;
	export let font_size = '0.7em';
	export let viewBox = k.empty;
	export let isPaging = false;
	export let text = k.space;
	export let name = k.empty;
	export let color = 'red';
	export let radius = 0;
	export let angle = 0;
	const { w_thing_fontFamily, w_background_color } = s;
	const text_path_id = `arc-path-${Math.random().toString(36).substr(2, 9)}`;
	const arcLength = text.length * parseFloat(font_size) * 0.48; // Rough estimate
	let start_thumb_transform = k.empty;
	let end_thumb_transform = k.empty;
	let text_path_d = k.empty;
	
	endpoints_onArc();

	function endpoints_onArc() {
		const sweepAngle = arcLength / radius;
		const startAngle = angle - sweepAngle / 2;
		const endAngle = startAngle + sweepAngle;
		const invert = new Angle(angle).orientation_ofAngle == T_Orientation.up;
		const { start: text_start, end: text_end } = endpoints(startAngle, endAngle, radius, invert);
		const { start: thumb_start, end: thumb_end } = endpoints(startAngle, endAngle, radius + 0.3);
		const startThumbAngleDeg = (startAngle + Math.PI/2) * 180 / Math.PI;
		const endThumbAngleDeg = (endAngle - Math.PI/2) * 180 / Math.PI;
		const sweepFlag = invert ? 0 : 1;
		text_path_d = `M ${text_start.x} ${text_start.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${text_end.x} ${text_end.y}`;
		start_thumb_transform = `translate(${thumb_start.x}, ${thumb_start.y}) rotate(${startThumbAngleDeg})`;
		end_thumb_transform = `translate(${thumb_end.x}, ${thumb_end.y}) rotate(${endThumbAngleDeg})`;
	}

	function endpoints(startAngle: number, endAngle: number, arc_radius: number, invert: boolean) {
		const startX = center_ofArc.x + arc_radius * Math.cos(invert ? endAngle : startAngle);
		const startY = center_ofArc.y + arc_radius * Math.sin(invert ? endAngle : startAngle);
		const endX = center_ofArc.x + arc_radius * Math.cos(invert ? startAngle : endAngle);
		const endY = center_ofArc.y + arc_radius * Math.sin(invert ? startAngle : endAngle);
		return { start: new Point(startX, startY), end: new Point(endX, endY) };
	}

</script>

<svg class='text-on-arc'
	style='
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		z-index: {zindex};
		position: absolute;
		pointer-events: none;'>
	<path id={text_path_id} d={text_path_d} fill='none' />
	<text
		fill={color}
		text-anchor='middle'
		font-size={font_size}
		font-family={font_family}
		dominant-baseline='middle'
		style='pointer-events: auto;'>
		<textPath href='#{text_path_id}' startOffset='50%'>
			<tspan style='background-color: {background_color};'>
				{text}
			</tspan>
		</textPath>
	</text>
	{#if isPaging}
		<Cluster_Pager
			color={color}
			viewBox={viewBox}
			size={k.height.dot}
			direction='backward'
			name={name+'-start'}
			thumbTransform={start_thumb_transform}/>
		<Cluster_Pager
			color={color}
			viewBox={viewBox}
			name={name+'-end'}
			direction='forward'
			size={k.height.dot}
			thumbTransform={end_thumb_transform}/>
	{/if}
</svg>

<style>
	.text-on-arc {
		overflow: visible;
	}
</style>
