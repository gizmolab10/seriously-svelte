<script lang="ts">
    import * as d3 from 'd3';
    import { onMount } from 'svelte';

    let startAngle = 0;
    let endAngle = Math.PI/2;
    let innerRadius = 50;
    let outerRadius = 100;

    $: path = d3.arc()({
        innerRadius,
        outerRadius,
        startAngle,
        endAngle
    }) || '';

    onMount(() => {
        console.log('Component mounted');
        console.log('Path:', path);
    });
</script>

<main>
    <h1>SVG Test oh my</h1>
    <div>Path: {path}</div>
    <svg width="400" height="400" viewBox="0 0 400 400">
        <path 
            d={path}
            fill="#ffeee3"
            stroke="#e6d4e6"
            stroke-width="2.5"
        />
    </svg>
</main>

<style>
    main {
        padding: 2rem;
    }
    svg {
        border: 1px solid black;
    }
</style> 