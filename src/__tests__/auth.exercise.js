import {resetDb} from 'utils/db-utils'
import {loginForm} from '../../test/utils/generate'
import startServer from '../start'

import axiosClient from './utils/api'

let server, api

beforeAll(async () => {
	server = await startServer()

	api = axiosClient(server.address().port)
})

beforeEach(async () => {
	await resetDb()
})

afterAll(async () => {
	await server.close()

	resetDb()
})

describe('auth', () => {
	test('#login', async () => {
		const {username, password} = loginForm()

		const data = await api.post('/auth/register', {
			username,
			password,
		})

		expect(data.user).toEqual({
			id: expect.any(String),
			username,
			token: expect.any(String),
		})
	})

	test('#register', async () => {
		const {username, password} = loginForm()

		const createUserResponse = await api.post('/auth/register', {
			username,
			password,
		})

		expect(createUserResponse.user).toEqual({
			id: expect.any(String),
			username,
			token: expect.any(String),
		})

		const loginResponse = await api.post('/auth/login', {
			username,
			password,
		})

		expect(loginResponse.user).toHaveProperty(
			'id',
			createUserResponse.user.id,
		)
		expect(loginResponse.user).toHaveProperty(
			'username',
			createUserResponse.user.username,
		)
	})

	test('/me - endpoint returning the user logged', async () => {
		const {username, password} = loginForm()

		const createUserResponse = await api.post('/auth/register', {
			username,
			password,
		})

		expect(createUserResponse.user).toEqual({
			id: expect.any(String),
			username,
			token: expect.any(String),
		})

		const loginResponse = await api.post('/auth/login', {
			username,
			password,
		})

		expect(loginResponse.user).toHaveProperty(
			'id',
			createUserResponse.user.id,
		)
		expect(loginResponse.user).toHaveProperty(
			'username',
			createUserResponse.user.username,
		)
		expect(loginResponse.user).toHaveProperty('token')

		const authorizedResponse = await api.get('/auth/me', {
			headers: {
				Authorization: `Bearer ${loginResponse.user.token}`,
			},
		})

		expect(authorizedResponse.user).toHaveProperty(
			'id',
			loginResponse.user.id,
		)
		expect(authorizedResponse.user).toHaveProperty(
			'username',
			loginResponse.user.username,
		)
		expect(authorizedResponse.user).toHaveProperty('token')
	})

	test('/register returns username taken when registering the same username', async () => {
		const {username, password} = loginForm()

		await api.post('/auth/register', {
			username,
			password,
		})

		const error = await api
			.post('/auth/register', {
				username,
				password,
			})
			.catch((r) => r)

		expect(error).toMatchInlineSnapshot(
			`[Error: 400: {"message":"username taken"}]`,
		)
	})
})
