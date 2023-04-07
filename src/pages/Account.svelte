<script lang="ts">
    import type { Row } from 'tinybase/store'
	import { readHandle, getAccount, relationships, addStatuses, store } from "../lib/mastodon"
	import { Timeline } from "svelte-vertical-timeline"
    import Status from '../components/Status.svelte'
    import { derived, type Readable } from 'svelte/store'
    import { localRows } from '../lib/tinystore'
    import { sort } from '@accuser/svelte-store-array'

	$: document.title = `${account ? $account.displayName : 'Account' } | Trunkless`
	
	export let params: Record<string, string> = {}

	let account: Readable<Row>
	let statuses: Readable<Row[]>

	const { handle } = params,
		url = readHandle(handle)

	getAccount(url)
		.then(async acc => {
			account = acc
			if (relationships.getLocalRowIds('accountStatuses', url).length == 0) await addStatuses(url)
			statuses = derived(
				sort(
					localRows(relationships, 'accountStatuses', url),
					// Do an b-a comparison instead of an a-b comparison to get a reverse-chronological timeline
					(a, b) => (b.createdAt as string).localeCompare(a.createdAt as string)
				),
				// TODO: Until I can figure out how to get virtual lists working, I'm just going
				// to hardcap the number of tweets shown.
				$statuses => $statuses.slice(0, 2000) 
			)
		})
</script>

<div>
	{#if account}
		<h2>{ $account.displayName }</h2>
		<a href={url}><p>{ handle }</p></a>
	{:else}
		<h2>Loading...</h2>
	{/if}

	{#if statuses}
		<p>{ $statuses.length } status(es)</p>
		<Timeline>
			{#each $statuses as status (status.url)}
				<!-- TODO: Have categories for statuses, statuses and replies, and media. -->
				{#if !status.inReplyToId}
					<Status account={$account} {status} connector={true} />
				{/if}
			{/each}
		</Timeline>
	{:else}
		<p>Loading...</p>
	{/if}
</div>
