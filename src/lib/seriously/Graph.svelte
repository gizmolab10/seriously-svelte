<script lang="ts" >
  import Widget from './Widget.svelte';
  import Idea from './Idea.ts';
  
  let root = new Idea('funny guy', 'green', false, 'b')
</script>

<div>
	<Widget idea={root}/>
</div>
