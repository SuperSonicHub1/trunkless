/** A key-value store implemented in TinyBase. */

import { readable } from "svelte/store"
import type { Id } from "tinybase/common"
import type { Cell, GetCellChange, Store } from "tinybase/store"

const CELL_NAME: Id = 'value'


type EntryListener = (kv: TinyKV, key: Id, newValue: Cell, oldValue: Cell, getCellChange: GetCellChange | undefined) => void
type KeysListener = (kv: TinyKV) => void

export default class TinyKV {
	private store: Store
	private tableId: Id
 
	constructor(store: Store, tableId: Id) {
		this.store = store
		this.tableId = tableId
	}

	getStore() {
		return this.store
	}

	getTableId() {
		return this.tableId
	}

	getBackingTable() {
		return this.store.getTable(this.tableId)
	}

	getValue(key: Id) {
		return this.store.getCell(this.tableId, key, CELL_NAME)
	}

	setValue(key: Id, value: Cell) {
		return this.store.setCell(this.tableId, key, CELL_NAME, value)
	}

	getKeys() {
		return this.store.getRowIds(this.tableId)
	}

	getValues() {
		return Object.values(this.getBackingTable()).map(row => row.value)
	}

	getEntries(): [key: Id, value: Cell][] {
		return Object.entries(this.getBackingTable()).map(([key, row]) => [key, row.value])
	}

	addEntryListener(key: Id, listener: EntryListener, mutator?: boolean) {
		const cellListener = (store, tableId: Id, rowId: Id, cellId: Id, newCell: Cell, oldCell: Cell, getCellChange: GetCellChange | undefined,) => {
			queueMicrotask(() => listener(this, rowId, newCell, oldCell, getCellChange))
		}
		return this.store.addCellListener(this.tableId, key, CELL_NAME, cellListener, mutator)
	}

	addKeysListener(listener: KeysListener, mutator?: boolean) {
		const rowIdsListener = () => {
			queueMicrotask(() => listener(this))
		}
		return this.store.addRowIdsListener(this.tableId, rowIdsListener, mutator)
	}

	delListener(listenerId: string) {
		this.store.delListener(listenerId)
		return this
	}
}

export function entry (kv: TinyKV, key: Id) {
	return readable(kv.getValue(key), set => {
		const listenerId = kv.addEntryListener(key, (_kv, _key, newValue) => set(newValue))
		return () => kv.delListener(listenerId)
	})
}
