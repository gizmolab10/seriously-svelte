<script>
	import { k, s, u, Angle, Point, debug, T_Layer, T_Orientation } from '../../ts/common/Global_Imports';
	export let background_color = $w_background_color;
	export let font_family = $w_thing_fontFamily;
	export let center_ofArc = Point.zero;
	export let zindex = T_Layer.text;
	export let font_size = '0.7em';
	export let text = k.space;
	export let color = 'red';
	export let radius = 0;
	export let angle = 0;  // Starting angle in radians
	const { w_thing_fontFamily, w_background_color } = s;
	
	// Calculate the arc path
	// We'll create an arc that's long enough for the text
	// The text length determines how much of the arc we need
	$: arcLength = text.length * parseFloat(font_size) * 0.6; // Rough estimate
	$: sweepAngle = arcLength / radius;
	$: invert = new Angle(angle).orientation_ofAngle == T_Orientation.up;
	$: startAngle = angle - sweepAngle / 2;
	$: endAngle = startAngle + sweepAngle;
	$: startX = center_ofArc.x + radius * Math.cos(invert ? endAngle : startAngle);
	$: startY = center_ofArc.y + radius * Math.sin(invert ? endAngle : startAngle);
	$: endX = center_ofArc.x + radius * Math.cos(invert ? startAngle : endAngle);
	$: endY = center_ofArc.y + radius * Math.sin(invert ? startAngle : endAngle);
	$: sweepFlag = invert ? 0 : 1;
	$: pathD = `M ${startX} ${startY} A ${radius} ${radius} 0 0 ${sweepFlag} ${endX} ${endY}`;
	
	// Unique ID for this path
	const pathId = `arc-path-${Math.random().toString(36).substr(2, 9)}`;

</script>

{#if true}
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
	<path id={pathId} d={pathD} fill='none' />
	<text
		font-family={font_family}
		font-size={font_size}
		fill={color}
		text-anchor='middle'
		dominant-baseline='middle'
		style='pointer-events: auto;'>
		<textPath href='#{pathId}' startOffset='50%'>
			<tspan style='background-color: {background_color};'>
				{text}
			</tspan>
		</textPath>
	</text>
</svg>
{/if}

<style>
	.text-on-arc {
		overflow: visible;
	}
</style>
