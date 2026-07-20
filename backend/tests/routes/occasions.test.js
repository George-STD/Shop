const request = require('supertest');
const app = require('../../server');
const Occasion = require('../../models/Occasion');

describe('Occasions Public Routes', () => {
  let occasion;

  beforeAll(async () => {
    occasion = new Occasion({
      name: 'Birthday',
      slug: 'birthday',
      description: 'Happy Birthday',
      isActive: true,
      order: 1
    });
    await occasion.save();

    const inactiveOccasion = new Occasion({
      name: 'Halloween',
      slug: 'halloween',
      isActive: false,
      order: 2
    });
    await inactiveOccasion.save();
  });

  it('should fetch all active occasions', async () => {
    const res = await request(app).get('/api/occasions');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Birthday');
  });

  it('should return 500 if database fails', async () => {
    // Mock the find method to throw an error
    jest.spyOn(Occasion, 'find').mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const res = await request(app).get('/api/occasions');
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);

    jest.restoreAllMocks();
  });
});
