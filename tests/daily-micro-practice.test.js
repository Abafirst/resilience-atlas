'use strict';

jest.mock('../backend/models/MicroPracticePlan', () => ({
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

jest.mock('../backend/services/emailService', () => ({
  sendEmail: jest.fn(),
}));

jest.mock('../backend/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const MicroPracticePlan = require('../backend/models/MicroPracticePlan');
const { runDailyMicroPracticeJob } = require('../backend/jobs/daily-micro-practice');

describe('daily-micro-practice job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('only queries paid/full micro-practice plans for email sends', async () => {
    MicroPracticePlan.find.mockResolvedValueOnce([]);

    const summary = await runDailyMicroPracticeJob();

    expect(MicroPracticePlan.find).toHaveBeenCalledWith(
      { tier: { $in: ['paid', 'full'] } },
      expect.objectContaining({
        email: 1,
        startDate: 1,
        timezone: 1,
        lastEmailSentDate: 1,
        days: 1,
        tier: 1,
      }),
      expect.objectContaining({ skip: 0, limit: expect.any(Number), lean: true })
    );
    expect(summary).toEqual({ sent: 0, skipped: 0, error: 0 });
  });
});
