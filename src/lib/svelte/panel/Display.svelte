<script>
	import { signal, Signals, PersistID, persistLocal } from '../../ts/common/GlobalImports';
	import { line_gap } from '../../ts/managers/State';

	function handleInput(event) {
		// signal(Signals.layout);
		persistLocal.writeToKey(PersistID.line_gap, $line_gap);
	}

  </script>

<input
  min='15'
  max='30'
  type='range'
  bind:value={$line_gap}
  on:input={handleInput}
  on:keydown={(event) => { event.preventDefault(); }}
/>
<div style='text-align: center;'>
  Size: {$line_gap}
</div>

<style>
  input {
    width: 70px;  
    &:focus {
      outline: none;
    }
  }
</style>
