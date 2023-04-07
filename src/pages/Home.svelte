<script lang="ts">
    import { map, sort } from "@accuser/svelte-store-array";
    import { relationships, store } from "../lib/mastodon";
	import { Timeline } from "svelte-vertical-timeline"
    import { rows } from "../lib/tinystore"
    import { getLocalRows, getRemoteRow } from "../lib/util";
	import Status from "../components/Status.svelte"
    import { derived } from "svelte/store";
	import TinyKV, { entry } from "../lib/tinykv";
    import { onMount } from "svelte";

	$: document.title = 'Trunkless'
	
	const kv = new TinyKV(store, 'settings')
	kv.setValue('number', Math.random())
	const number = entry(kv, 'number')

	onMount(() => {
		setInterval(() => {
			kv.setValue('number', Math.random())
		}, 5000)
	})


	const statuses = map(
		derived(
			sort(
				rows(store, 'statuses'),
				// Do an b-a comparison instead of an a-b comparison to get a reverse-chronological timeline
				(a, b) => (b.createdAt as string).localeCompare(a.createdAt as string)
			),
			// TODO: Until I can figure out how to get virtual lists working, I'm just going
			// to hardcap the number of tweets shown.
			$statuses => $statuses.slice(0, 2000)
		),
		status => {
			return {
				status,
				account: getRemoteRow(relationships, 'accountStatuses', status.url as string)
			}
		}
	)
</script>

<!-- TODO: Feed can get slow. Virtual lists don't seem to play nice with Timeline. Help? -->
<div>
	<p>TinyKV test: { $number }</p>
	<!-- <p>{ $statuses.length } status(es)</p> -->
	<Timeline>
		{#each $statuses as { status, account } (status.url)}
			<!-- TODO: Have categories for statuses, statuses and replies, and media. -->
			{#if !status.inReplyToId}
				<Status account={account} {status} connector={true} />
			{/if}
		{/each}
	</Timeline>
</div>
