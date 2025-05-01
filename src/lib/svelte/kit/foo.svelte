<script>
  import * as d3 from 'd3';

  // Define reactive variables for start and end angles, and radii
  let startAngle = 0;  // Start angle in degrees
  let endAngle = 90;   // End angle in degrees
  let innerRadius = 50;
  let outerRadius = 100;

  // Reactive statement to compute the path when any of the parameters change
  $: foo_path = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .startAngle(d3.scaleLinear().domain([0, 360]).range([0, Math.PI * 2])(startAngle))  // Convert degrees to radians
    .endAngle(d3.scaleLinear().domain([0, 360]).range([0, Math.PI * 2])(endAngle)); // Convert degrees to radians

</script>

<svg width="300" height="300">
  <!-- Use the computed path string in the d attribute of the <path> element -->
  <path d={foo_path()} fill="none" stroke="black" stroke-width="2" />
</svg>

<!-- Controls to change start angle, end angle, inner radius, and outer radius -->
<div>
  <label>
    Start Angle (°): 
    <input type="number" bind:value={startAngle} min="0" max="360" />
  </label>
</div>

<div>
  <label>
    End Angle (°): 
    <input type="number" bind:value={endAngle} min="0" max="360" />
  </label>
</div>

<div>
  <label>
    Inner Radius: 
    <input type="number" bind:value={innerRadius} min="0" max="200" />
  </label>
</div>

<div>
  <label>
    Outer Radius: 
    <input type="number" bind:value={outerRadius} min="0" max="200" />
  </label>
</div>
