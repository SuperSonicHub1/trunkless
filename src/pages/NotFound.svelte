<script lang="ts">
	import { link } from 'svelte-spa-router'
	$: document.title = 'Page Not Found | Trunkless'
</script>

<div>
	<h2>You're a long way from home, son...</h2>
	<p>Why don't you go <a use:link href="/">back?</a></p>
	<p>(page not found)</p>
</div>
