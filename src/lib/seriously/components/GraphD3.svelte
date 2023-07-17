<script>
  import * as d3 from 'https://d3js.org/d3.v7.min.js';

  let canvas;
  export let data;
  export let width = 20;
  export let height = 30;
  export let marginTop = 2;
  export let marginRight = 2;
  export let marginBottom = 2;
  export let marginLeft = 2;

  $: x = d3.scaleLinear([0, data.length - 1], [marginLeft, width - marginRight]);
  $: y = d3.scaleLinear(d3.extent(data), [height - marginBottom, marginTop]);
  $: line = d3.line((d, i) => x(i), y);

  function drawLine() {
    const ctx = canvas.getContext("2d");

    let a = 100; // semi-major axis
    let e = 0.8; // eccentricity
    let b = a * Math.sqrt(1 - e * e); // semi-minor axis based on eccentricity

    ctx.beginPath();

    for (let angle = Math.PI; angle <= 1.5 * Math.PI; angle += 0.01) {
        let x = a * Math.cos(angle);
        let y = b * Math.sin(angle);
        ctx.lineTo(canvas.width / 2 + x, canvas.height / 2 - y);
    }

    ctx.stroke();
  }
  
</script>
<p>What the fluck?</p>
<svg width={width} height={height}>
  <path fill="none" stroke="red" stroke-width="1.5" d={line(data)} />
  <g fill="white" stroke="blue" stroke-width="1.5">
    {#each data as d, i}
      <circle key={i} cx={x(i)} cy={y(d)} r="2.5" />
    {/each}
  </g>
</svg>