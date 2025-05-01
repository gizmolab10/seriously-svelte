<script lang="ts">
    import * as d3 from 'd3';

    // Restore previous filled arc segment (donut slice) example
    let startAngle = 0;
    let endAngle = Math.PI / 3; // 60 degrees
    let innerRadius = 60;
    let outerRadius = 140;

    $: rawPath = d3.arc()({
        innerRadius,
        outerRadius,
        startAngle,
        endAngle
    }) || '';
</script>

<main>
    <svg width="400" height="400" viewBox="0 0 400 400">
        <g transform="translate(200,200)">
            <path 
                d={rawPath}
                fill="#b3cbe6"
                stroke="#99b8d8"
                stroke-width="5"
            />
            <circle cx="0" cy="0" r="12" fill="#9b6b8e" />
        </g>
    </svg>
</main> 