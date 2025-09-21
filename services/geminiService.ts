
import { GoogleGenAI, Chat } from "@google/genai";
import { AnalysisResult, RiskLevel, GroundingSource } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseAnalysisText = (text: string): Omit<AnalysisResult, 'sources' | 'originalContent' | 'originalType'> => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  let riskLevel: RiskLevel = RiskLevel.UNKNOWN;
  let summary = "Analysis could not be parsed correctly.";
  const details: string[] = [];

  const riskLine = lines.find(line => line.startsWith("Risk Level:"));
  if (riskLine) {
    const riskValue = riskLine.replace("Risk Level:", "").trim().toUpperCase();
    if (Object.values(RiskLevel).includes(riskValue as RiskLevel)) {
      riskLevel = riskValue as RiskLevel;
    }
  }

  const summaryIndex = lines.findIndex(line => line.startsWith("Summary:"));
  const detailsIndex = lines.findIndex(line => line.startsWith("Detailed Analysis:"));

  if (summaryIndex !== -1) {
    const endOfSummary = detailsIndex > summaryIndex ? detailsIndex : lines.length;
    summary = lines.slice(summaryIndex, endOfSummary).join(' ').replace("Summary:", "").trim();
  }

  if (detailsIndex !== -1) {
    for (let i = detailsIndex + 1; i < lines.length; i++) {
      if (lines[i].startsWith('- ')) {
        details.push(lines[i].substring(2).trim());
      }
    }
  }
  
  // Fallback if parsing fails
  if (riskLevel === RiskLevel.UNKNOWN && details.length === 0) {
    return {
        riskLevel: RiskLevel.UNKNOWN,
        summary: "The AI returned a response, but it could not be structured into a clear analysis. Please review the raw text below.",
        details: text.split('\n').filter(line => line.trim().length > 0)
    };
  }

  return { riskLevel, summary, details };
};

const getPrompt = (content: string, type: 'text' | 'url'): string => {
  if (type === 'url') {
    return `
      Analyze the content at the following URL for credibility, safety, and potential misinformation. Assess if the source is trustworthy, authorized, and safe for users. Use the Google Search tool to investigate the website's reputation, domain age, author credibility, and to fact-check the main claims in the content. Provide your analysis in the exact format below, without any introductory or concluding remarks.

      Risk Level: [Choose one: LOW, MEDIUM, HIGH, UNKNOWN]
      Summary: [A brief, one-paragraph summary of your findings. Address the content's accuracy, the source's credibility, and any potential safety concerns like phishing or excessive ads.]
      Detailed Analysis:
      - [First specific point of analysis, e.g., "Website Reputation: The domain is well-known and generally considered reliable/unreliable..."]
      - [Second specific point, e.g., "Author Credibility: The author is/is not a recognized expert in this field..."]
      - [Third specific point, e.g., "Fact-Check: The central claim in the article is supported/contradicted by information from these reputable sources..."]
      - [Fourth specific point, e.g., "User Experience & Safety: The site does/does not contain intrusive pop-ups, malware warnings, or signs of a phishing attempt..."]

      The URL to analyze is:
      "${content}"
    `;
  }
  
  return `
      Analyze the following text for potential misinformation. Use the Google Search tool to find grounding information. Provide your analysis in the exact format below, without any introductory or concluding remarks.

      Risk Level: [Choose one: LOW, MEDIUM, HIGH]
      Summary: [A brief, one-paragraph summary of your findings and the main reason for your risk assessment.]
      Detailed Analysis:
      - [First specific point of analysis. Explain why it's a concern, e.g., "Uses emotionally charged language..."]
      - [Second specific point of analysis, e.g., "Makes a factual claim without citing a credible source..."]
      - [Third specific point of analysis, e.g., "The claim contradicts information from reputable news organizations..."]

      The text to analyze is:
      "${content}"
    `;
};


export const analyzeContent = async (content: string, type: 'text' | 'url'): Promise<AnalysisResult> => {
  try {
    const prompt = getPrompt(content, type);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a secured research assistant. Your goal is to provide a neutral, fact-based analysis of content to identify potential misinformation without making definitive judgments. Your tone should be formal, objective, and helpful.",
        tools: [{ googleSearch: {} }],
      },
    });

    const parsedResult = parseAnalysisText(response.text);

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
        .map((chunk: any) => ({
            uri: chunk.web?.uri || '',
            title: chunk.web?.title || 'Unknown Source'
        }))
        .filter((source: GroundingSource) => source.uri);
    
    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return { 
      ...parsedResult, 
      sources: uniqueSources, 
      originalContent: content,
      originalType: type
    };

  } catch (error)
 {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get analysis from the AI model.");
  }
};


export const startChat = (analysis: AnalysisResult): Chat => {
  const history = [
    {
      role: 'user',
      parts: [{ text: `Here is the ${analysis.originalType} I analyzed:\n\n${analysis.originalContent}` }]
    },
    {
      role: 'model',
      parts: [{ text: `Understood. I have analyzed the content and provided the following assessment:\n\nRisk Level: ${analysis.riskLevel}\nSummary: ${analysis.summary}\nDetails: \n- ${analysis.details.join('\n- ')}\n\nI am ready to answer your follow-up questions.` }]
    }
  ];

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: history,
    config: {
      systemInstruction: "You are a secured research assistant. The user has just received an analysis of a piece of content. Your role is to answer their follow-up questions about this analysis or the topic in a neutral, fact-based manner. Do not make definitive judgments. Be helpful and objective.",
    }
  });

  return chat;
};