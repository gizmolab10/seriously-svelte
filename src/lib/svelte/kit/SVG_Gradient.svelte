<script>
	import { Size } from '../../ts/common/Global_Imports';
	export let path = 'M 50,50 C 50,50 50,50 50,50';
	export let size = Size.square(100);
	export let color = '#4a90e2';
	export let zindex = 0;
</script>

<svg width={size.width} height={size.height} viewBox='0 0 {size.width} {size.height}'>
	<defs>
		<radialGradient id='shading' cx='50%' cy='50%' r='50%' fx='50%' fy='50%'>
			<stop offset='0%' stop-color={color} stop-opacity='0' />
			<stop offset='100%' stop-color={color} stop-opacity='1' />
		</radialGradient>
	</defs>
	<path d={path} fill='url(#shading)' />
</svg>