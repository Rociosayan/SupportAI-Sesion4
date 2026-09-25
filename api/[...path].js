import { handleApiRequest } from '../backend/src/server.js'

export const config = {
  maxDuration: 30,
  includeFiles: ['knowledge/**'],
}

export default async function handler(req, res) {
  await handleApiRequest(req, res)
}
