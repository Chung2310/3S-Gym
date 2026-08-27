import request from 'supertest';
import app from '../app.js';
describe('Validation các route công cụ dùng chung', () => {
  it('từ chối dữ liệu tính dinh dưỡng vượt phạm vi', async () => {
    const response = await request(app).post('/api/nutrition/calculate').send({ weight: 0, height: 300, age: 5, mealCount: 20, gender: 'unknown' });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, message: 'Dữ liệu gửi lên không hợp lệ.' });
    expect(response.body.errors.map((error: { field: string }) => error.field)).toEqual(expect.arrayContaining(['weight', 'height', 'age', 'mealCount', 'gender']));
  });

  it('từ chối query tạo ảnh món ăn không hợp lệ', async () => {
    const response = await request(app).get('/api/nutrition/meal-image?seed=-1');
    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe('seed');
  });

  it('từ chối dữ liệu quét InBody và upload thiếu ảnh', async () => {
    const scan = await request(app).post('/api/nutrition/scan-inbody').send({ imageBase64: 'ngan' });
    const upload = await request(app).post('/api/upload/image');
    expect(scan.status).toBe(400);
    expect(scan.body.errors[0].field).toBe('imageBase64');
    expect(upload.status).toBe(400);
    expect(upload.body.errors[0].field).toBe('image');
  });
});
