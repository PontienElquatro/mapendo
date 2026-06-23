import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../api/generate';

describe('Backend API Validation', () => {
  it('should return 400 if required fields are missing', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ sender: '', receiver: '', message: '' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({ error: "Missing required fields" }));
  });

  it('should return 400 if message exceeds max length', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({
        sender: 'Jules',
        receiver: 'Marie',
        message: 'A'.repeat(1001)
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({ error: "Message too long" }));
  });
});
