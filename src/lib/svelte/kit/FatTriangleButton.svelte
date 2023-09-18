<script>
	import { editor, constants, dbDispatch, FatTrianglePath } from "../../ts/common/GlobalImports";
  import { idHere } from '../../ts/managers/State';
	const triangle = new FatTrianglePath(18, 0);
  export let origin = new Point(15, 20);
  const path = triangle.path;
  export let color = 'red';
  
	function handleClick(event) {
		const grab = dbDispatch.db.hierarchy.grabs.furthestGrab(true);
    editor.thing_redraw_remoteMoveRight(grab, false, false);
  }

</script>

<button class='svg-button' on:click={handleClick}>
  <svg width='20' height='20' viewbox='0 0 20 20' style='position: absolute; left: {origin.x}px; top: {origin.y}px;'>
    <path d={path} stroke={color} fill={constants.backgroundColor}/>
  </svg>
</button>

<style>
  .svg-button {
      background: none;
      border: none;
      padding: 0;
      display: inline-block; /* or block */
      width: 15px;   /* Match SVG viewbox width */
      height: 15px;  /* Match SVG viewbox height */
      cursor: pointer;
      outline: none; /* Optional: Remove focus outline, but only if you provide another focus style */
  }

  .svg-button svg {
      display: block; /* This removes any unwanted space below the SVG */
  }

  .svg-button:hover {
      /* Styles for hover state, e.g., change SVG color */
  }

  .svg-button:active {
      /* Styles for active state */
  }

  .svg-button:focus {
      /* Styles for focus state, e.g., add an outline or change SVG color */
  }
</style>