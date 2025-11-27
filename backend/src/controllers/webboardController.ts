import { Context } from 'hono';
import { getWebboardPosts, createWebboardPost, replyToPost } from '../services/webboardService';

export const getPostsController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('courseId');
    const posts = await getWebboardPosts(courseId, user);
    return c.json({ success: true, data: posts });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const createPostController = async (c: Context) => {
  try {
    const user = c.get('user');
    const courseId = c.req.param('courseId');
    const { question } = await c.req.json();

    if (!question) {
      return c.json({ success: false, error: 'กรุณากรอกคำถาม' }, 400);
    }

    const post = await createWebboardPost(courseId, question, user);
    return c.json({ success: true, data: post });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};

export const replyPostController = async (c: Context) => {
  try {
    const user = c.get('user');
    const postId = c.req.param('postId');
    const { content } = await c.req.json();

    if (!content) {
      return c.json({ success: false, error: 'กรุณากรอกคำตอบ' }, 400);
    }

    const reply = await replyToPost(postId, content, user);
    return c.json({ success: true, data: reply });
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 400);
  }
};


