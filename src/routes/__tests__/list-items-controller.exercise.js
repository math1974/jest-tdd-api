// Testing Controllers
import * as generate from 'utils/generate'
import * as booksDB from '../../db/books'
import * as listItemsDB from '../../db/list-items'
import * as listItemsController from '../list-items-controller'

jest.mock('../../db/books')
jest.mock('../../db/list-items')

beforeEach(() => {
	jest.resetAllMocks()
})

test('getListItem returns the req.listItem', async () => {
	const user = generate.buildUser({
		id: 'FIXED_USER_ID',
		username: 'username',
		password: 'password',
	})

	const book = generate.buildBook({
		id: 'FIXED_BOOK_ID',
		title: 'title',
		author: 'author',
		coverImageUrl: 'coverImageUrl',
		pageCount: 'pageCount',
		publisher: 'publisher',
		synopsis: 'synopsis',
	})

	booksDB.readById.mockResolvedValueOnce(book)

	const listItem = generate.buildListItem({
		id: 'LIST_ITEM_FIXED',
		bookId: book.id,
		ownerId: user.id,
		rating: 5,
		notes: 3,
		finishDate: '2022-08-10 20:00',
		startDate: '2022-08-01 07:00',
	})

	const req = generate.buildReq({listItem})

	const res = generate.buildRes()

	await listItemsController.getListItem(req, res)

	expect(booksDB.readById).toHaveBeenCalledTimes(1)

	expect(booksDB.readById).toHaveBeenCalledWith(book.id)

	expect(res.json).toHaveBeenCalledTimes(1)
	expect(res.json).toMatchInlineSnapshot(`
		[MockFunction json] {
		  "calls": Array [
		    Array [
		      Object {
		        "listItem": Object {
		          "book": Object {
		            "author": "author",
		            "coverImageUrl": "coverImageUrl",
		            "id": "FIXED_BOOK_ID",
		            "pageCount": "pageCount",
		            "publisher": "publisher",
		            "synopsis": "synopsis",
		            "title": "title",
		          },
		          "bookId": "FIXED_BOOK_ID",
		          "finishDate": "2022-08-10 20:00",
		          "id": "LIST_ITEM_FIXED",
		          "notes": 3,
		          "ownerId": "FIXED_USER_ID",
		          "rating": 5,
		          "startDate": "2022-08-01 07:00",
		        },
		      },
		    ],
		  ],
		  "results": Array [
		    Object {
		      "type": "return",
		      "value": Object {
		        "json": [MockFunction json] {
		          "calls": Array [
		            Array [
		              Object {
		                "listItem": Object {
		                  "book": Object {
		                    "author": "author",
		                    "coverImageUrl": "coverImageUrl",
		                    "id": "FIXED_BOOK_ID",
		                    "pageCount": "pageCount",
		                    "publisher": "publisher",
		                    "synopsis": "synopsis",
		                    "title": "title",
		                  },
		                  "bookId": "FIXED_BOOK_ID",
		                  "finishDate": "2022-08-10 20:00",
		                  "id": "LIST_ITEM_FIXED",
		                  "notes": 3,
		                  "ownerId": "FIXED_USER_ID",
		                  "rating": 5,
		                  "startDate": "2022-08-01 07:00",
		                },
		              },
		            ],
		          ],
		          "results": [Circular],
		        },
		        "status": [MockFunction status],
		      },
		    },
		  ],
		}
	`)
})

test('createListItem returns a 400 error if no bookId is provided', async () => {
	const user = generate.buildUser()
	const req = generate.buildReq({
		user,
		body: {},
	})
	const res = generate.buildRes()

	await listItemsController.createListItem(req, res)

	expect(res.status).toHaveBeenCalledWith(400)
	expect(res.status).toHaveBeenCalledTimes(1)
	expect(res.json).toHaveBeenCalledTimes(1)
	expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "message": "No bookId provided",
		  },
		]
	`)
})

test('setListItem returns the req.listItem and call next', async () => {
	const user = generate.buildUser()
	const book = generate.buildBook()

	const listItem = generate.buildListItem({bookId: book.id, ownerId: user.id})

	listItemsDB.readById.mockResolvedValueOnce(listItem)

	const req = generate.buildReq({
		params: {
			id: listItem.id,
		},
		user,
	})

	const res = generate.buildRes()
	const next = generate.buildNext()

	await listItemsController.setListItem(req, res, next)

	expect(listItemsDB.readById).toHaveBeenCalledTimes(1)
	expect(listItemsDB.readById).toHaveBeenCalledWith(listItem.id)

	expect(next).toHaveBeenCalledTimes(1)
	expect(next).toHaveBeenCalledWith()

	expect(req.listItem).toStrictEqual(listItem)
	expect(res.status).not.toHaveBeenCalled()
	expect(res.json).not.toHaveBeenCalled()
})

test('setListItem returns 404 when no list item is found', async () => {
	const user = generate.buildUser()
	const book = generate.buildBook()

	const listItem = generate.buildListItem({
		id: 'LIST_ITEM_ID',
		bookId: book.id,
		ownerId: user.id,
	})

	listItemsDB.readById.mockResolvedValueOnce(null)

	const req = generate.buildReq({
		params: {
			id: listItem.id,
		},
		user,
	})

	const res = generate.buildRes()
	const next = generate.buildNext()

	await listItemsController.setListItem(req, res, next)

	expect(listItemsDB.readById).toHaveBeenCalledWith(listItem.id)

	expect(res.status).toHaveBeenCalledTimes(1)
	expect(res.status).toHaveBeenCalledWith(404)

	expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "message": "No list item was found with the id of LIST_ITEM_ID",
		  },
		]
	`)

	expect(next).not.toHaveBeenCalled()
})

test('setListItem returns 403 when the listItem owner id is not the user logged', async () => {
	const user = generate.buildUser({
		id: 'LOGGED_USER_ID',
	})
	const ownerUser = generate.buildUser({
		id: 'OWNER_USER_ID',
	})
	const book = generate.buildBook()

	const listItem = generate.buildListItem({
		id: 'LIST_ITEM_ID',
		bookId: book.id,
		ownerId: ownerUser.id,
	})

	listItemsDB.readById.mockResolvedValueOnce(listItem)

	const req = generate.buildReq({
		params: {
			id: listItem.id,
		},
		user,
	})

	const res = generate.buildRes()
	const next = generate.buildNext()

	await listItemsController.setListItem(req, res, next)

	expect(listItemsDB.readById).toHaveBeenCalledWith(listItem.id)

	expect(res.status).toHaveBeenCalledTimes(1)
	expect(res.status).toHaveBeenCalledWith(403)

	expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "message": "User with id LOGGED_USER_ID is not authorized to access the list item LIST_ITEM_ID",
		  },
		]
	`)

	expect(next).not.toHaveBeenCalled()
})

test('getListItems returns an array with results', async () => {
	const user = generate.buildUser()
	const historyBook = generate.buildBook()
	const scienceBook = generate.buildBook()

	const historyListItem = generate.buildListItem({
		bookId: historyBook.id,
		ownerId: user.id,
	})
	const scienceListItem = generate.buildListItem({
		bookId: scienceBook.id,
		ownerId: user.id,
	})

	listItemsDB.query.mockResolvedValueOnce([historyListItem, scienceListItem])

	booksDB.readManyById.mockResolvedValueOnce([historyBook, scienceBook])

	const req = generate.buildReq({
		user,
	})

	const res = generate.buildRes()

	await listItemsController.getListItems(req, res)

	expect(booksDB.readManyById).toBeCalledWith([
		historyBook.id,
		scienceBook.id,
	])
	expect(listItemsDB.query).toBeCalledWith({ownerId: user.id})
	expect(booksDB.readManyById).toBeCalledTimes(1)

	expect(res.json).toHaveBeenCalledWith({
		listItems: [
			{
				...historyListItem,
				book: historyBook,
			},
			{
				...scienceListItem,
				book: scienceBook,
			},
		],
	})
})

test('getListItems returns an empty array', async () => {
	const user = generate.buildUser()

	listItemsDB.query.mockResolvedValueOnce([])

	const req = generate.buildReq({
		user,
	})

	const res = generate.buildRes()

	await listItemsController.getListItems(req, res)

	expect(res.json).toHaveBeenCalledWith({
		listItems: [],
	})
})

test('createListItem returns the item created ', async () => {
	const user = generate.buildUser()
	const book = generate.buildBook()

	const listItem = generate.buildListItem({ownerId: user.id, bookId: book.id})

	listItemsDB.query.mockResolvedValueOnce([])
	listItemsDB.create.mockResolvedValueOnce(listItem)
	booksDB.readById.mockResolvedValueOnce(book)

	const req = generate.buildReq({
		user,
		body: {
			bookId: book.id,
		},
	})

	const res = generate.buildRes()

	await listItemsController.createListItem(req, res)

	expect(listItemsDB.query).toHaveBeenCalledWith({
		ownerId: user.id,
		bookId: book.id,
	})
	expect(listItemsDB.query).toHaveBeenCalledTimes(1)

	expect(listItemsDB.create).toHaveBeenCalledWith({
		ownerId: user.id,
		bookId: book.id,
	})
	expect(listItemsDB.create).toHaveBeenCalledTimes(1)

	expect(booksDB.readById).toHaveBeenCalledWith(book.id)
	expect(booksDB.readById).toHaveBeenCalledTimes(1)

	expect(res.status).not.toHaveBeenCalled()

	expect(res.json).toHaveBeenCalledTimes(1)
	expect(res.json).toHaveBeenCalledWith({
		listItem: {
			...listItem,
			book,
		},
	})
})

test('createListItem returns 400 when the bookId is not provided ', async () => {
	const user = generate.buildUser()

	const req = generate.buildReq({
		user,
		body: {},
	})

	const res = generate.buildRes()

	await listItemsController.createListItem(req, res)

	expect(res.status).toHaveBeenCalledWith(400)
	expect(res.status).toHaveBeenCalledTimes(1)

	expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "message": "No bookId provided",
		  },
		]
	`)

	expect(listItemsDB.query).not.toHaveBeenCalled()
})

test('createListItem returns 400 when the user already have a list item with the bookId provided  ', async () => {
	const user = generate.buildUser({
		id: 'USER_ID',
	})
	const book = generate.buildBook({
		id: 'BOOK_ID',
	})
	const listItem = generate.buildListItem({ownerId: user.id, bookId: book.id})

	listItemsDB.query.mockResolvedValueOnce([listItem])

	const req = generate.buildReq({
		user,
		body: {
			bookId: book.id,
		},
	})

	const res = generate.buildRes()

	await listItemsController.createListItem(req, res)

	expect(listItemsDB.query).toHaveBeenCalledWith({
		ownerId: user.id,
		bookId: book.id,
	})
	expect(listItemsDB.query).toHaveBeenCalledTimes(1)

	expect(res.status).toHaveBeenCalledWith(400)
	expect(res.status).toHaveBeenCalledTimes(1)

	expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "message": "User USER_ID already has a list item for the book with the ID BOOK_ID",
		  },
		]
	`)
})

test('updateListItem returns the updated list item', async () => {
	const user = generate.buildUser()
	const book = generate.buildBook()
	const listItem = generate.buildListItem({ownerId: user.id, bookId: book.id})
	const updatedListItem = generate.buildListItem({
		id: listItem.id,
		ownerId: user.id,
		bookId: book.id,
	})

	listItemsDB.update.mockResolvedValueOnce(updatedListItem)
	listItemsDB.readById.mockResolvedValueOnce(listItem)
	booksDB.readById.mockResolvedValueOnce(book)

	const res = generate.buildRes()
	const req = generate.buildReq({
		listItem,
		body: updatedListItem,
	})

	await listItemsController.updateListItem(req, res)

	expect(listItemsDB.update).toHaveBeenCalledWith(
		listItem.id,
		updatedListItem,
	)
	expect(listItemsDB.update).toHaveBeenCalledTimes(1)

	expect(res.json).toHaveBeenCalledWith({
		listItem: {
			...updatedListItem,
			book,
		},
	})

	expect(res.json).toHaveBeenCalledTimes(1)
})

test('updateListItem returns 404 when list item to update was not found', async () => {
	const user = generate.buildUser()
	const book = generate.buildBook()
	const listItem = generate.buildListItem({
		id: 'LIST_ITEM_ID',
		ownerId: user.id,
		bookId: book.id,
	})
	const updatedListItem = generate.buildListItem({
		id: listItem.id,
		ownerId: user.id,
		bookId: book.id,
	})

	listItemsDB.update.mockResolvedValueOnce(null)

	const res = generate.buildRes()
	const req = generate.buildReq({
		listItem,
		body: updatedListItem,
	})

	await listItemsController.updateListItem(req, res)

	expect(listItemsDB.update).toHaveBeenCalledWith(
		listItem.id,
		updatedListItem,
	)
	expect(listItemsDB.update).toHaveBeenCalledTimes(1)

	expect(res.status).toHaveBeenCalledWith(404)
	expect(res.status).toHaveBeenCalledTimes(1)

	expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
		Array [
		  Object {
		    "message": "No list item was found with the id of LIST_ITEM_ID",
		  },
		]
	`)

	expect(res.json).toHaveBeenCalledTimes(1)
})

test('deleteListItem returns success', async () => {
	const user = generate.buildUser()
	const book = generate.buildBook()
	const listItem = generate.buildListItem({ownerId: user.id, bookId: book.id})

	const res = generate.buildRes()
	const req = generate.buildReq({
		listItem,
	})

	await listItemsController.deleteListItem(req, res)

	expect(listItemsDB.remove).toHaveBeenCalledWith(listItem.id)
	expect(listItemsDB.remove).toHaveBeenCalledTimes(1)

	expect(res.json).toHaveBeenCalledWith({
		success: true,
	})

	expect(res.json).toHaveBeenCalledTimes(1)
})
