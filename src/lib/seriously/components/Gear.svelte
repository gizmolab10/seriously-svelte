<script>
  import { onMount } from '../common/GlobalImports';
  export let size = '10px';
  let gear;

  onMount(() => { gear = document.getElementById('gear'); });
  function spin() { gear.style.animation = 'spin 1s linear infinite'; };
  function stop() {} // gear.style.animation = 'none'; };

</script>

<style>
  #gear {
    border: 10px solid transparent;
    border-top: 10px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    100% {
      transform: rotate(360deg);
    }
  }
</style>

<div id='gear' style='width: {size}; height: {size}'></div>
