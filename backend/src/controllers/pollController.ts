import { Context } from 'hono';
import {
  getPollsByCourse,
  createPoll,
  updatePoll,
  deletePoll,
} from '../services/pollService';

export const getPollsController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('courseId');
    const polls = await getPollsByCourse(courseId, user);
    return c.json({ success: true, data: polls });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const createPollController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('courseId');
    const data = await c.req.json();
    const poll = await createPoll(courseId, data, user);
    return c.json({ success: true, data: poll });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const updatePollController = async (c: Context) => {
  try {
    const user = c.get('user');
    const pollId = c.req.param('pollId');
    const data = await c.req.json();
    const poll = await updatePoll(pollId, data, user);
    return c.json({ success: true, data: poll });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const deletePollController = async (c: Context) => {
  try {
    const user = c.get('user');
    const pollId = c.req.param('pollId');
    const result = await deletePoll(pollId, user);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

