<script lang="ts">
	import { TimelineItem, TimelineContent, TimelineDot, TimelineOppositeContent, TimelineSeparator, TimelineConnector } from "svelte-vertical-timeline"
	import { link } from "svelte-spa-router"
	import type { Row } from "tinybase/store"
    import { writeHandle } from "../lib/mastodon";
    import { dateTimeFormat } from "../lib/util";

	export let account: Row
	export let status: Row
	export let connector: boolean = false

	const createdAt = status.createdAt as string
	const handle = writeHandle(account.username as string, account.url as string)
</script>

<TimelineItem>
	<TimelineOppositeContent slot="opposite-content">
		<a class="shadow" use:link href="/{handle}">
			<strong>{ account.displayName }</strong>
		</a>
		<div class="deemphasize">
			<p>{ handle }</p>
			<p>
				<a class="shadow" use:link href="/{handle}/{status.id}">

					<time datetime={createdAt}> { dateTimeFormat.format(Date.parse(createdAt)) }</time>
				</a>
			</p>
		</div>
	</TimelineOppositeContent>
	<TimelineSeparator>
		<TimelineDot 
			style={`
				width: 4em;
				height: 4em;
				background-color: initial;
				border-color: transparent;`}
			>
			<img
				loading="lazy"
				src={account.avatar.toString()}
				alt="Avatar for @{account.username}">
		</TimelineDot>
		{#if connector}
			<TimelineConnector />
		{/if}
	</TimelineSeparator>
	<TimelineContent>
		{#if status.reblogId}
			<p>TODO: Implement reblogs</p>
		{:else}
			{ @html status.content }
		{/if}
	</TimelineContent>
</TimelineItem>

<style>
	.deemphasize {
		color: rgba(255, 255, 255, 0.47);
	}
	a.shadow {
		color: inherit;
		text-decoration: initial;
	}
</style>
