import { derived } from "svelte/store"
import type { Relationships } from "tinybase/relationships";
import type { Row } from "tinybase/store";

export async function firstFromAsyncIter<T = unknown>(iterator: AsyncIterable<T>): Promise<T> {
	for await (const item of iterator) return item
}

export function getLocalRows(relationships: Relationships, relationshipId: string, remoteRowId: string): Row[] {
	return relationships.getLocalRowIds(relationshipId, remoteRowId).map(id => relationships.getStore().getRow(relationships.getLocalTableId(relationshipId), id))
}

export function getRemoteRow(relationships: Relationships, relationshipId: string, localRowId: string): Row {
	return relationships.getStore().getRow(
		relationships.getRemoteTableId(relationshipId), 
		relationships.getRemoteRowId(relationshipId, localRowId)
	)
}

export const numberFormat = new Intl.NumberFormat(navigator.language)
export const dateTimeFormat = new Intl.DateTimeFormat(navigator.language, {
	dateStyle: "medium",
	timeStyle: "medium" 
})

export const relativeTimeFormat = new Intl.RelativeTimeFormat(navigator.language)
