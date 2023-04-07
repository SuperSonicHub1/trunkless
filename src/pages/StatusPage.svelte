<script lang="ts">
	import { link } from 'svelte-spa-router'
    import type { Row } from 'tinybase/store';
	import { readHandle, getAccount, relationships, addStatuses, store } from "../lib/mastodon"
    import Status from '../components/Status.svelte';
    import { getLocalRows } from '../lib/util'
	import { Timeline } from "svelte-vertical-timeline"
	import type { Readable } from "svelte/store"
    import { row } from '../lib/tinystore';
	
	export let params: Record<string, string> = {}

	let account: Readable<Row>
	let status: Readable<Row>

	const { handle, status_id } = params,
		url = readHandle(handle),
		statusUrl = `${url}/${status_id}`

	getAccount(url)
		.then(async acc => {
			account = acc
			status = row(store, 'statuses', statusUrl)
		})
</script>

<div>
	{#if account && status}
		<h2>{ $account.displayName }</h2>
		<a href={url}><p>{ handle }</p></a>

		<Timeline>
			<Status account={$account} status={$status} />
		</Timeline>
	{:else}
		<h2>Loading...</h2>
	{/if}

</div>
