<script lang="ts">
    import { Point } from './src/lib/ts/common/Geometry';
    export let angle_atStart = Math.PI / -3;
    export let angle_atEnd = Math.PI / 1.2;
    export let color_ofStroke = '#99b8d8';
    export let color_ofFill = '#b3cbe6';
    export let inner_radius = 100;
    export let outer_radius = 140;
    $: thickness = (outer_radius - inner_radius);
    $: outer_end = Point.polarTo(angle_atEnd, outer_radius);
    $: inner_end = Point.polarTo(angle_atEnd, inner_radius);
    $: outer_start = Point.polarTo(angle_atStart, outer_radius);
    $: inner_start = Point.polarTo(angle_atStart, inner_radius);
    $: arc_sweep = (angle_atEnd - angle_atStart) <= Math.PI ? 0 : 1;

    // Path for the arc
    $: path_ofArc = `
        M ${outer_start.x} ${outer_start.y}
        A ${outer_radius} ${outer_radius} 0 ${arc_sweep} 1 ${outer_end.x} ${outer_end.y}
        A ${thickness/2} ${thickness/2} 0 0 1 ${inner_end.x} ${inner_end.y}
        A ${inner_radius} ${inner_radius} 0 ${arcSweep} 0 ${inner_start.x} ${inner_start.y}
        A ${thickness/2} ${thickness/2} 0 0 1 ${outer_start.x} ${outer_start.y}
        Z`;
</script>

<main>
    <svg width="400" height="400" viewBox="0 0 400 400">
        <g transform="translate(200,200)">
            <path 
                d={path_ofArc}
                fill={color_ofFill}
                stroke={color_ofStroke}
                stroke-width="5"
            />
			{#if show_arc}
				<circle cx="0" cy="0" r="12" fill="#9b6b8e" />
			{/if}
        </g>
    </svg>
</main> 