// https://neet.github.io/masto.js/
import { login, type FetchAccountStatusesParams } from "masto"
import type { MastoClient, Account, Status, Emoji } from "masto"
// https://tinybase.org/api/store/
import { createStore } from "tinybase/store"
import { createRelationships } from "tinybase/relationships"
import { createQueries } from "tinybase/queries"
import { createLocalPersister } from "tinybase/persisters"
import type { Row } from "tinybase/store"
import { firstFromAsyncIter, getLocalRows } from "./util"
import { row } from "./tinystore"
import { get, type Readable } from "svelte/store"

/// Tinybase

export const store = createStore()
export const queries = createQueries(store)
queries.setQueryDefinition('follows', 'accounts', ({ select, where }) => {
	select('username')
	select('url')
	select('displayName')
	select('statusesCount')
	select('lastStatusAt')
	select('id')
	where('following', true)
})
export const relationships = createRelationships(store)
	.setRelationshipDefinition(
		'accountStatuses',
		'statuses',
		'accounts',
		'accountId'
	)
	.setRelationshipDefinition(
		'statusApplications',
		'statuses',
		'applications',
		'applicationId'
	)
	.setRelationshipDefinition(
		'statusCards',
		'statuses',
		'cards',
		'cardId'
	)
	.setRelationshipDefinition(
		'statusAttachments',
		'attachments',
		'statuses',
		'statusId'
	)
	.setRelationshipDefinition(
		'statusMentions',
		'mentions',
		'statuses',
		'statusId'
	)
	.setRelationshipDefinition(
		'statusPolls',
		'polls',
		'statuses',
		'statusId'
	)
	.setRelationshipDefinition(
		'statusPollOptions',
		'pollOptions',
		'polls',
		'pollId'
	)
	.setRelationshipDefinition(
		'statusReblogs',
		'statuses',
		'statuses',
		'reblogId'
	)
	.setRelationshipDefinition(
		'statusTags',
		'tags',
		'statuses',
		'statusId'
	)

export const persister = createLocalPersister(store, 'trunkless')
await persister.startAutoLoad()

/// Mastodon

const HEADERS = {
	'User-Agent': 'trunkless-0.0.1 (github:@supersonichub1)',
}

const instances: Map<string, MastoClient> = new Map<string, MastoClient>()

export async function getInstance(url: string): Promise<MastoClient> {
	if (instances.has(url)) return instances.get(url)
	else {
		const instance = await login({
			url,
			headers: HEADERS
		})
		instances.set(url, instance)
		return instance
	}
}

/**
 * Parse output of {@link writeHandle}.
 */
export function readHandle(handle: string): string {
	const [acct, hostname] = handle.slice(1).split('@', 2)
	return `https://${hostname}/@${acct}`
}

export function writeHandle(username: string, url: string): string {
	return `@${username}@${(new URL(url)).hostname}`
}

/// Database insertion and retrieval

// https://github.com/Prouser123/mastodon-userid-lookup/blob/main/api/index.js
// https://fedi.simonwillison.net/@simon/109323662190701199
export async function getAccountId(url: string): Promise<string | null> {
	const regex = /<url>https?:\/\/.*\/avatars\/(.*)\/original\/.*<\/url>/gm
	const res = await fetch(`${url}.rss`, { headers: HEADERS }),
		text = await res.text(),
		m = regex.exec(text)
	
	if (m !== null) return m[1].replaceAll("/", "")
}

export async function addAccount(url: string) {
    const urlWithRootPath = new URL("/", url).toString(),
    	instance = await getInstance(urlWithRootPath),
		userId = await getAccountId(url),
		account = await instance.accounts.fetch(userId)

    insertAccount(account)
	await persister.save()
}

export async function updateAccount(accountRow: Row) {
	const urlWithRootPath = new URL("/", accountRow.url as string).toString(),
		instance = await getInstance(urlWithRootPath),
		account = await instance.accounts.fetch(accountRow.id as string)

	insertAccount(account)
	await persister.save()
}

export async function getAccount(url: string): Promise<Readable<Row>> {
	if (store.getRowIds('accounts').includes(url)) return row(store, 'accounts', url)
	else {
		await addAccount(url)
		return await getAccount(url)
	}
}

export async function addStatuses(url: string) {
    const urlWithRootPath = new URL("/", url).toString(),
    	instance = await getInstance(urlWithRootPath),
		account = await getAccount(url),
		// TODO: For now, only get first page of statuses, will support pagination, pins later
		statuses = await firstFromAsyncIter(await instance.accounts.getStatusesIterable(get(account).id as string, {
			excludeReplies: false,
			pinned: false,			
		}))

	for (const status of statuses) insertStatus(status)
	await persister.save()
}

// TOOD: Some the ways this data is inserted is kinda stupid.
// Will probably ned a do-over with me making a diagram of some kind.
function insertStatus(status: Status) {
	const { url, uri } = status
	const id = url ?? uri

	const instanceHostname = (new URL(id)).hostname
	const { 
		account,
		application,
		card,
		emojis,
		mediaAttachments,
		mentions,
		poll,
		reblog,
		tags,

		// Things that only matter to someone who's logged in, which we aren't.
		// We destructure it so we don't include it in our DB.
		bookmarked,
		favourited,
		muted,
		pinned,
		reblogged,

		...everythingElse
	} = status

	insertAccount(account)

	if (application) store.setPartialRow('applications', application.name, { ...application })
	if (card !== null) store.setPartialRow('cards', card.url, { ...card })
	for (const emoji of emojis) insertEmoji(emoji, instanceHostname)
	const attachmentsWithoutMeta = mediaAttachments.map(attachment => {
		const { meta, ...everythingElse } = attachment
		return everythingElse
	})
	for (const attachment of attachmentsWithoutMeta) store.setPartialRow('attachments', `${instanceHostname}:${attachment.id}`, { ...attachment, statusId: id })
	for (const mention of mentions) store.setPartialRow('mentions', `${id}:${mention.id}`, { ...mention, statusId: id })
	if (poll !== null) {
		const {
			options,

			// Things that only matter to someone who's logged in, which we aren't.
			// We destructure it so we don't include it in our DB.
			voted,
			ownVotes,
			
			...everythingElse
		} = poll
		for (const option of options) {
			const { emojis: optionEmojis, ...everythingElse } = option
			// The types lied to me...
			// Emojis for options can sometimes be undefined
			if (optionEmojis) for (const emoji of optionEmojis) insertEmoji(emoji, instanceHostname)
			store.setPartialRow('pollOptions', `${id}:${option.title}`, {  ...everythingElse, pollId: id })
		}
		store.setPartialRow('polls', `${id}`, { ...everythingElse, statusId: id })
	}
	if (reblog !== null) insertStatus(reblog)
	for (const tag of tags) {
		// I don't care about history
		const { history, ...everythingElse } = tag
		store.setPartialRow('tags', `${id}:${everythingElse.url}`, { ...everythingElse, statusId: id })
	}

	store.setPartialRow('statuses', id, {
		...everythingElse,
		accountId: account.url,
		applicationId: application ? application.name : null,
		cardId: card !== null ? card.url : null,
		reblogId: reblog !== null ? reblog.url : null
	})
}

// Get ID of most recent tweet
function deriveMinId(url: string): string | null {
	const ids = getLocalRows(relationships, 'accountStatuses', url).map(({ id }) => parseInt(id as string))
	return ids.length > 0 ? Math.max(...ids).toString() : null
}

// Get ID of least recent tweet
function deriveMaxId(url: string): string | null {
	const ids = getLocalRows(relationships, 'accountStatuses', url).map(({ id }) => parseInt(id as string))
	return ids.length > 0 ? Math.min(...ids).toString() : null
}

// TODO: If a user isn't able to download all of a user's
// backlog in one sitting, how should we handle that?
// Do we just not care? <- I think this might be the way to go...
// Should we have to calls to getStatusesIterable,
// one for minId and one for maxId?
export async function* syncFollow(account: Row) {
	const url = account.url as string,
		handle = writeHandle(account.username as string, url)

	yield `Updating account info for ${handle}.`
	await updateAccount(account)
	// store.setCell('accounts', account.url as string, 'following', true)
	
	yield `Getting statuses for ${handle}.`
	
	
	const urlWithRootPath = new URL("/", url).toString(),
		instance = await getInstance(urlWithRootPath)
	
	// TODO: Handle pins?
	const baseConfig: FetchAccountStatusesParams = {
		excludeReplies: false,
		pinned: false,
		limit: 100,
	}

	const minId = deriveMinId(url),
		maxId = deriveMaxId(url)
	
	// If we have no statuses,
	if (maxId === null && minId === null) {
		// get all statuses.
		yield* addAllStatuses(instance, account.id as string, handle, baseConfig) 
	} else {
		// Get statuses older and newer than the ones we have.
		for (const [key, id] of [['minId', minId], ['maxId', maxId], ]) {
			yield `${minId} for ${handle}`
			yield* addAllStatuses(instance, account.id as string, handle, {
				...baseConfig,
				[key]: id
			})
		}
	}

	yield `Syncing of ${handle} complete!`
}

async function* addAllStatuses(instance: MastoClient, accountId: string, handle: string, config: FetchAccountStatusesParams) {
	const paginator = await instance.accounts.getStatusesIterable(accountId, config)
	
	for await (const statuses of paginator) {
		const { length } = statuses
		yield `Inserting ${length} ${length > 0 ? `(${statuses[0].id} - ${statuses[length - 1].id}) ` : ''}statuses from ${handle}.`
		for (const status of statuses) insertStatus(status)
		await persister.save()
	}
	
	await persister.save()
}

function insertAccount(account: Account) {
	const { url } = account,
		instanceHostname = (new URL(url)).hostname
	const { emojis, fields, ...everythingElse } = account
	store.setPartialRow('accounts', url, everythingElse)
	for (const emoji of emojis) insertEmoji(emoji, instanceHostname)
	for (const field of fields) store.setPartialRow('fields', `${url}:${field.name}`, { accountUrl: url, ...field })
}

function insertEmoji(emoji: Emoji, instanceHostname: string) {
	store.setPartialRow('emojis', `${instanceHostname}:${emoji.shortcode}`, { ...emoji })
}
