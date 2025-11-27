import { Context } from 'hono';
import { getLiveSessions } from '../services/liveSessionService';

export const getLiveSessionsController = async (c: Context) => {
  try {
    const user = c.get('user');
    const sessions = await getLiveSessions(user);
    return c.json({ success: true, data: sessions });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500);
  }
};


