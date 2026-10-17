const geminiManager = require('../../utils/geminiModelManager');

describe('Gemini Model Manager Utility', () => {
  beforeEach(() => {
    // Reset internal state if needed or we just mock Date.now
  });

  it('should export required methods', () => {
    expect(geminiManager.generateWithFallback).toBeDefined();
    expect(geminiManager.MODEL_TIERS).toBeDefined();
    expect(geminiManager.MODEL_TIERS.map((t) => t.id)).toEqual([
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
    ]);
  });

  it('should generate content with the first available model', async () => {
    const mockAiClient = {
      models: {
        generateContent: jest.fn().mockResolvedValue({ text: 'mocked text' })
      }
    };
    const response = await geminiManager.generateWithFallback(mockAiClient, {
      contents: 'Hello AI',
      config: { temperature: 0.7 }
    });

    expect(response.text).toBe('mocked text');
    expect(response.modelUsed).toBe('gemini-3.8-flash');
  });
});
