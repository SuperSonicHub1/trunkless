<script lang="ts">
	import { jobs, jobCount, updates } from "../lib/jobs"
	import { numberFormat } from "../lib/util"

	const tagLine = `${ $jobCount } active job${$jobCount === 1 ? '' : 's'}`

	$: document.title = `${tagLine} | Trunkless`
	// import { filter } from "@accuser/svelte-store-array"
</script>

<div>
	<h2>Jobs</h2>
	<p>{tagLine}</p>

	<h3>Listings</h3>

	{#each $jobs as job}
		<h4>{ job.title }</h4>
		<p>ID: { job.id }</p>
	{/each}

	<h3>Updates</h3>

	<pre>
		<ul>
			{#each $updates as update}
				<li>
					{ update.id } @ { update.timestamp }: { update.update }
				</li>
			{/each}
		</ul>
	</pre>
</div>
