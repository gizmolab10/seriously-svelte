<script>
  export let d = "M 50,50 C 50,50 50,50 50,50"; // Default path data
  export let width = 100;
  export let height = 100;
  export let fillColor = "#4a90e2";
</script>

<svg {width} {height} viewBox="0 0 100 100">
  <!-- Define the gradient -->
  <defs>
    <radialGradient id="shading" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" stop-color={fillColor} stop-opacity="1" />
      <stop offset="100%" stop-color={fillColor} stop-opacity="0.5" />
    </radialGradient>
  </defs>

  <!-- Apply the gradient to the path -->
  <path {d} fill="url(#shading)" />
</svg> 