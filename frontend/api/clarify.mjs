import { handleVercelRequest } from "../server/vercel-handler.mjs";
export default { fetch: (request) => handleVercelRequest(request, "clarify") };
