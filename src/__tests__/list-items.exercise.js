// Testing CRUD API Routes

import {resetDb, insertTestUser} from 'utils/db-utils'
import * as generate from 'utils/generate'
import * as booksDB from '../db/books'
import startServer from '../start'

import axiosClient from './utils/api'

let server, api

beforeAll(async () => {
	server = await startServer()

	api = axiosClient(server.address().port)
})

afterAll(() => server.close())

beforeEach(() => resetDb())

async function setup() {
	const testUser = await insertTestUser()

	api.defaults.headers.common.authorization = `Bearer ${testUser.token}`

	return testUser
}

test('POST /list-items returns success', async () => {
	const testUser = await setup()

	const book = generate.buildBook()

	await booksDB.insert(book)

	const {listItem} = await api.post('/list-items', {
		bookId: book.id,
	})

	expect(listItem.ownerId).toBe(testUser.id)
	expect(listItem.bookId).toBe(book.id)
})

test('POST /list-items returns error when no bookId is provided', async () => {
	const book = generate.buildBook()

	await booksDB.insert(book)

	const error = await api.post('/list-items').catch((e) => e)

	expect(error).toMatchInlineSnapshot(
		`[Error: 400: {"message":"No bookId provided"}]`,
	)
})

test('POST /list-items returns error when list item exists', async () => {
	const testUser = await setup()

	const book = generate.buildBook()

	await booksDB.insert(book)

	await api.post('/list-items', {
		bookId: book.id,
	})

	const error = await api
		.post('/list-items', {
			bookId: book.id,
		})
		.catch((e) => e)

	const errorMessage = error.data.message
		.replace(book.id, 'BOOK_ID')
		.replace(testUser.id, 'LIST_ITEM_USER_ID')

  expect(errorMessage).toMatchInlineSnapshot(
		`"User LIST_ITEM_USER_ID already has a list item for the book with the ID BOOK_ID"`,
	)
})

test('UPDATE /list-items/:id', async () => {
	const testUser = await setup()

	const book = generate.buildBook()

	await booksDB.insert(book)

	const {listItem} = await api.post('/list-items', {
		bookId: book.id,
	})

	expect(listItem.ownerId).toBe(testUser.id)
	expect(listItem.bookId).toBe(book.id)

	const newListItemInfo = generate.buildListItem({
		bookId: book.id,
		startDate: listItem.startDate,
		finishDate: listItem.finishDate,
		id: listItem.id,
		ownerId: testUser.id,
		book,
	})

	const {listItem: listItemUpdated} = await api.put(
		`/list-items/${listItem.id}`,
		newListItemInfo,
	)

	expect(newListItemInfo).toEqual(listItemUpdated)
})

test('UPDATE /list-items/:id return error when id was not found', async () => {
	await setup()

	const error = await api
		.put(`/list-items/ANY_ID_WHICH_DOESNT_EXIST`)
		.catch((e) => e)

	expect(error).toMatchInlineSnapshot(
		`[Error: 404: {"message":"No list item was found with the id of ANY_ID_WHICH_DOESNT_EXIST"}]`,
	)
})

test('GET /list-items/:id', async () => {
	const testUser = await setup()

	const book = generate.buildBook()

	await booksDB.insert(book)

	const {listItem: listItemCreated} = await api.post('/list-items', {
		bookId: book.id,
	})

	expect(listItemCreated.ownerId).toBe(testUser.id)
	expect(listItemCreated.bookId).toBe(book.id)

	const {listItem} = await api.get(`/list-items/${listItemCreated.id}`)

	expect(listItem).toEqual(listItemCreated)
})

test('GET /list-items', async () => {
	await setup()

	const books = [generate.buildBook(), generate.buildBook()]

	await booksDB.insertMany(books)

	const {listItem: listItem1} = await api.post('/list-items', {
		bookId: books[0].id,
	})
	const {listItem: listItem2} = await api.post('/list-items', {
		bookId: books[1].id,
	})

	const listItemsCreated = [listItem1, listItem2]

	const {listItems} = await api.get('/list-items')

	expect(listItems).toHaveLength(2)
	expect(listItems).toEqual(listItemsCreated)
})

test('DELETE /list-items/:id', async () => {
	const testUser = await setup()

	const book = generate.buildBook()

	await booksDB.insert(book)

	const {listItem} = await api.post('/list-items', {
		bookId: book.id,
	})

	expect(listItem.ownerId).toBe(testUser.id)
	expect(listItem.bookId).toBe(book.id)

	const resp = await api.delete(`/list-items/${listItem.id}`)

	expect(resp).toMatchInlineSnapshot(`
		Object {
		  "success": true,
		}
	`)
})

test('DELETE /list-items/:id returns error when not passing a valid listItem id', async () => {
	await setup()

	const resp = await api
		.delete(`/list-items/ANY_ID_WHICH_DOESNT_EXIST`)
		.catch((e) => e)

	expect(resp).toMatchInlineSnapshot(
		`[Error: 404: {"message":"No list item was found with the id of ANY_ID_WHICH_DOESNT_EXIST"}]`,
	)
})

/* eslint no-unused-vars:0 */
