import { destroySession } from "../../lib/session.js";

export default async function handler(req, res) {
  destroySession(res);
  res.status(200).json({ ok: true });
}
