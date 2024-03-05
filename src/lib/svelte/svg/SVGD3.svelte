<script>
    import { k, Point, ZIndex, onMount, onDestroy } from '../../ts/common/GlobalImports';
    import * as d3 from 'd3';
    export let fill = 'none';
    export let position = 'absolute';
    export let zIndex = ZIndex.dots;
    export let scalablePath = '';
    export let stroke = 'black';
    export let size = 10;
    export let x = 0;
    export let y = 0;
    let svg;

    onMount(() => {
        d3.select(svg)
            .append('path')
            .attr('fill', fill)
            .attr('stroke', stroke)
            .attr('d', scalablePath)
            .attr('stroke-width', 1)
            .attr('shape-rendering', 'geometricPrecision'); // anti-alias;
    })

    $: {
        if (fill) {
            d3.select(svg)
                .select('path')
                .attr('fill', fill)
                .attr('stroke', stroke)
                .attr('d', scalablePath)
                .attr('stroke-width', 1)
                .attr('shape-rendering', 'geometricPrecision') // anti-alias
            svg = svg;
        }
    }

</script>

<svg bind:this={svg}
    width={size}px
    height={size}px
    viewBox='0 0 {size} {size}'
    style='
        top: {y}px;
        left: {x}px;
        z-index: {zIndex};
        position: {position};
        shape-rendering: geometricPrecision;'/>
