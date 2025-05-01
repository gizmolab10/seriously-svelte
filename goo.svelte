<script lang="ts">
    import * as d3 from 'd3';

    // Restore previous filled arc segment (donut slice) example
    let startAngle = 0;
    let endAngle = Math.PI / 3; // 60 degrees
    let innerRadius = 60;
    let outerRadius = 140;
    let thickness = (outerRadius - innerRadius) / 2;
    let circleRadius = thickness;

    $: rawPath = d3.arc()({
        innerRadius,
        outerRadius,
        startAngle,
        endAngle
    }) || '';

    // Calculate the center points for the circles at the arc ends (on the arc's midline)
    function polarToCartesian(angle, radius) {
        return {
            x: Math.cos(angle - Math.PI / 2) * radius,
            y: Math.sin(angle - Math.PI / 2) * radius
        };
    }

    $: midRadius = (innerRadius + outerRadius) / 2;
    $: start = polarToCartesian(startAngle, midRadius);
    $: end = polarToCartesian(endAngle, midRadius);
</script>

<main>
    <svg width="400" height="400" viewBox="0 0 400 400">
        <g transform="translate(200,200)">
            <path 
                d={rawPath}
                fill="#b3cbe6"
                stroke="#99b8d8"
                stroke-width="5"
                stroke-linecap="round"
            />
            <circle cx={start.x} cy={start.y} r={circleRadius} fill="#b3cbe6" stroke="#99b8d8" stroke-width="5" />
            <circle cx={end.x} cy={end.y} r={circleRadius} fill="#b3cbe6" stroke="#99b8d8" stroke-width="5" />
            <circle cx="0" cy="0" r="12" fill="#9b6b8e" />
        </g>
    </svg>
</main> 