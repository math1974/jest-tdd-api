import axios from 'axios';

import { getData, handleRequestFailure } from 'utils/async';

const AxiosClient = port => {
	const baseURL = `http://localhost:${port}/api`

	const client = axios.create({ baseURL });

	client.interceptors.response.use(getData, handleRequestFailure);

	return client;
}

export default AxiosClient;