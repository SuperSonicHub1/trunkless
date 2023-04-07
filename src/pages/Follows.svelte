<script lang="ts">
	import { link } from "svelte-spa-router"
	import { addAccount, store, queries, readHandle, writeHandle, syncFollow, persister, relationships } from "../lib/mastodon"
	import { Job, addJob } from "../lib/jobs"
	import { numberFormat } from "../lib/util"
	import online from "../lib/online";
    import { table, resultTable } from "../lib/tinystore";
    import { sort } from "@accuser/svelte-store-array";
    import { derived } from "svelte/store";
    import type { Row } from "tinybase/store";

	$: document.title = 'Follows | Trunkless'

	const follows = resultTable(queries, 'follows'),
		statuses = table(store, 'statuses'),
		// TODO: There's gotta be a better way to do this
		followsDisplay = sort(
			derived(
				[follows, statuses],
				([$follows, $statuses]): [string, Row, number][] => {
					const statusAccountIds = Object
						.values($statuses)
						.map(status => status.accountId)
					return Object
						.entries($follows)
						.map(([url, account]) => [
							url,
							account,
							statusAccountIds
								.filter(accountId => accountId === url)
								.length
						])
				}
			),
			(a, b) => a[1].username.toString().localeCompare(b[1].username.toString())
		)

	async function followAccount(url: string) {
		if (store.getRowIds('accounts').includes(url)) {
			store.setCell('accounts', url, 'following', true) 
			await persister.save()
		}
		else {
			// TODO: Stop here and show error if offline
			await addAccount(url)
			await followAccount(url)
		}
	}

	async function unfollowAccount(url: string) {
		store.setCell('accounts', url, 'following', false)
		await persister.save()
	}

	function syncFollows() {
		for (const account of Object.values($follows)) {
			addJob(new Job(`Syncing ${writeHandle(account.username as string, account.url as string)}`, syncFollow(account)))
		}
	}

	// Test users:
	// https://pony.social/@cadey/
	// https://mastodon.social/@danluu
	// https://dan.mastohon.com/@danhon
	// https://fedi.simonwillison.net/@simon
	// https://octodon.social/@cwebber
	// https://toot.community/@ridehome
	// https://mastodon.social/@jeffjarvis
	// https://twit.social/@leo

	// Bruh: MastoUnauthorizedError: This method requires an authenticated user
	// Does work occasionally (usually if you repeat an action multiple times)
	// might be caused by my hot reloader... strange
	// https://octodon.social/@fasterthanlime
	// https://octodon.social/@CobaltVelvet
</script>

<div>
	<h2>Follows</h2>
	
	<p>Follow an account</p>
	<form on:submit|preventDefault={async e => {
		const form = e.currentTarget
		for (const element of form.elements) {
			// @ts-ignore Wouldn't be a problem if I could actually write TypeScript here...
			element.disabled = true
		}
		
		const urlInput = form.elements['url']
		let url = urlInput.value.trim()
		urlInput.value = ''
		
		// Should throw error if invalid input given
		if (url.startsWith("@")) url = readHandle(url)
		else if (url.endsWith('/')) url = url.slice(0, -1)

		try {
			await followAccount(url)
		} catch (error) {
			console.log(error)
		}

		for (const element of form.elements) {
			// @ts-ignore Wouldn't be a problem if I could actually write TypeScript here...
			element.disabled = false
		}
	}}>
		<label for="">
			Account URL:
			<input disabled={!$online} name='url' id='url' placeholder="https://mastodon.social/@danluu">
		</label>
		<button disabled={!$online} type="submit">Add</button>
	</form>

	<hr>

	<button disabled={!$online} on:click|preventDefault={syncFollows}>Sync Follows</button>

	{#each $followsDisplay as [url, account, statusesOnDevice] (url)}
		{@const username = account.username.toString()}
		{@const accountUrl = account.url.toString()}
		{@const statusesCount = Number(account.statusesCount)}
		{@const lastStatusAt = account.lastStatusAt}
		<article >
			<a use:link href={`/${writeHandle(username, accountUrl)}`}>
				<h3>{ account.displayName }</h3>
			</a>
			<p>{ writeHandle(username, accountUrl) }</p>
			<p>
				<!-- TODO: Also show how many statuses we actually have on record. -->
				<!-- TODO: I wish there was a way to update a store if one of multiple values change... -->
				<span>
					{ numberFormat.format(statusesOnDevice) } / { numberFormat.format(statusesCount) } status{statusesCount === 1 ? '' : 'es'}
				</span>
				<span role='none'>|</span>
				<span>
					last status posted { lastStatusAt }
				</span>
			</p>
			<a href={url}><p>{ url }</p></a>
			<button on:click|preventDefault={() => unfollowAccount(url)} >Unfollow Account</button>
		</article>
	{/each}
</div>
