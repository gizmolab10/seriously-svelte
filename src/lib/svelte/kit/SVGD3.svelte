<script lang='ts'>
    import { k, Point, T_Layer } from '../../ts/common/Global_Imports';
	import { onMount } from 'svelte';
    import * as d3 from 'd3';
    export let stroke = k.color_default;
    export let zindex = T_Layer.common;
    export let position = 'absolute';
    export let svgPath = k.empty;
    export let name = 'SVGD3';
    export let fill = 'none';
    export let height = 10;
    export let width = 10;
    export let left = 0;
    export let top = 0;
    let svg;

    onMount(() => {
        d3.select(svg)
            .append('path')
            .attr('fill', fill)
            .attr('stroke', stroke)
            .attr('stroke-width', 1)
            .attr('class', `${name}`)
            .attr('shape-rendering', 'geometricPrecision') // anti-alias;
            .attr('d', svgPath);
    })

    $: {
        if (!!fill) {
            d3.select(svg)
                .select('path')
                .attr('fill', fill)
                .attr('stroke', stroke)
                .attr('stroke-width', 1)
                .attr('class', `${name}-path`)
                .attr('shape-rendering', 'geometricPrecision') // anti-alias
                .attr('d', svgPath);
            svg = svg;
        }
    }

</script>

<svg class={name}
    bind:this={svg}
    width={width}px
    height={height}px
    viewBox='{left} {top} {width} {height}'
    style='
        top: 0px;
        left: 0px;
        z-index: {zindex};
        position: {position};
        shape-rendering: geometricPrecision;'/>
