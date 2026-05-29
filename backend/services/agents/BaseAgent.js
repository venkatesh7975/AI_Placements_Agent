const { GoogleGenAI } = require('@google/genai');

class BaseAgent {
  constructor(name) {
    this.name = name;
    this.aiClient = null;
    this.modelName = 'gemini-2.5-flash';

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log(`[${this.name}] Gemini API connection initialized successfully.`);
      } catch (error) {
        console.error(`[${this.name}] Failed to initialize Gemini API Client. Falling back to Mock AI.`, error);
      }
    } else {
      console.log(`[${this.name}] No GEMINI_API_KEY found in .env. Operating in Mock AI Engine mode.`);
    }
  }

  /**
   * Clean and parse JSON from markdown code blocks if the model outputs them.
   */
  parseJSONResponse(text) {
    try {
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      return JSON.parse(cleanText.trim());
    } catch (error) {
      console.error(`[${this.name}] Error parsing AI JSON response:`, error);
      throw new Error(`[${this.name}] AI returned invalid JSON: ` + text);
    }
  }

  /**
   * Check if the agent should use the mock engine
   */
  shouldUseMock() {
    return !this.aiClient || process.env.USE_MOCK_AI === 'true';
  }

  /**
   * Wrapper for generating content with Gemini
   */
  async generateJSONContent(prompt) {
    const response = await this.aiClient.models.generateContent({
      model: this.modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return this.parseJSONResponse(response.text);
  }
}

module.exports = BaseAgent;
