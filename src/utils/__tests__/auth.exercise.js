// Testing Authentication API Routes

import cases from 'jest-in-case';
import { isPasswordAllowed } from '../auth';


// 🐨 import the things you'll need
// 💰 here, I'll just give them to you. You're welcome
// import axios from 'axios'
// import {resetDb} from 'utils/db-utils'
// import * as generate from 'utils/generate'
// import startServer from '../start'

// 🐨 you'll need to start/stop the server using beforeAll and afterAll
// 💰 This might be helpful: server = await startServer({port: 8000})

// 🐨 beforeEach test in this file we want to reset the database

const Casefy = testCases => {
	return Object.entries(testCases).map(([title, input]) => {
		return {
			name: `${input} - ${title}`,
			value: input
		}
	});
}

cases(
	'isPasswordAllowed: valid password',
	opts => {
		const result = isPasswordAllowed(opts.value)

		expect(result).toBe(true)
	},
	Casefy({
		'when password is valid': 'Matheus@1'
	})
);

cases(
	'isPasswordAllowed: invalid password',
	opts => {
		const result = isPasswordAllowed(opts.value)

		expect(result).toBe(false);
	},
	Casefy({
		'when password is not provided': null,
		'when password doesnt have a number': 'matheus',
		'when password doesnt have an uppercase letter': 'matheus',
		'when password doesnt have a lowercase letter': 'matheus',
		'when password doenst have a non-alphanumeric': 'matheus',
		'when password has length < 7': 'carla',
	}),
);