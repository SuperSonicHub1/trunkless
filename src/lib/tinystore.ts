/**
 * An implementation of the Svelte store contract <https://svelte.dev/docs#component-format-script-4-prefix-stores-with-$-to-access-their-values-store-contract>
 * for TinyBase.
 * TODO: Consider making this a library.
 */

import type { Store, Row } from "tinybase/store";
import { derived, readable, type Readable } from "svelte/store";
import type { Id } from "tinybase/common";
import type { Relationships } from "tinybase/relationships";
import { map } from "@accuser/svelte-store-array";
import type { Queries } from "tinybase/queries";

export function table(store: Store, tableId: Id) {
	return readable(store.getTable(tableId), set => {
		const listenerId = store.addTableListener(tableId, (store, tableId) => {
			set(store.getTable(tableId))
		})
		return () => store.delListener(listenerId)
	})
}

export function row(store: Store, tableId: Id, rowId: Id) {
	return readable(store.getRow(tableId, rowId), set => {
		const listenerId = store.addRowListener(tableId, rowId, (store, tableId, rowId) => {
			set(store.getRow(tableId, rowId))
		})
		return () => store.delListener(listenerId)
	})
}

export function rows(store: Store, tableId: Id): Readable<Row[]> {
	return derived(table(store, tableId), Object.values)
}

export function localRowIds(relationships: Relationships, relationshipId: Id, remoteRowId: Id) {
	return readable(relationships.getLocalRowIds(relationshipId, remoteRowId), set => {
		const listenerId = relationships.addLocalRowIdsListener(
			relationshipId,
			remoteRowId,
			(relationships, relationshipId, remoteRowId) => {
				set(relationships.getLocalRowIds(relationshipId, remoteRowId))
			}
		)
		return () => relationships.delListener(listenerId)
	})
}

export function localRows(relationships: Relationships, relationshipId: Id, remoteRowId: Id) {
	const store = relationships.getStore(),
		localTableId = relationships.getLocalTableId(relationshipId)
	return map(
		localRowIds(relationships, relationshipId, remoteRowId),
		(rowId) => store.getRow(localTableId, rowId)
	)
}

export function resultTable(queries: Queries, queryId: Id) {
	return readable(queries.getResultTable(queryId), set => {
		const listenerId = queries.addResultTableListener(
			queryId,
			(queries, queryId) => {
				set(queries.getResultTable(queryId))
			}
		)
		return () => queries.delListener(listenerId)
	})
}
