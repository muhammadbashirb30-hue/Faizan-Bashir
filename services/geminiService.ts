import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { AIContent, Event, GroundingSource, AITrendReport, HotTopic, KeywordStrategy, StockMetadata } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const contentIdeaResponseSchema = {
  type: Type.OBJECT,
  properties: {
    ideas: {
      type: Type.ARRAY,
      description: 'A list of 5 creative content ideas.',
      items: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'A short, SEO-friendly title for the content idea.'
          },
          description: {
            type: Type.STRING,
            description: 'A brief description of the creative concept, including visual styles or subjects.'
          },
          keywords: {
            type: Type.ARRAY,
            description: 'A list of 5-10 relevant keywords for the idea.',
            items: {
              type: Type.STRING
            }
          }
        },
        required: ['title', 'description', 'keywords']
      }
    },
    uploadTip: {
      type: Type.STRING,
      description: 'A concise tip on when to upload this content for maximum visibility, e.g., "Upload 4-6 weeks before the event."'
    }
  },
  required: ['ideas', 'uploadTip']
};

const trendReportResponseSchema = {
    type: Type.OBJECT,
    properties: {
        ideas: {
            type: Type.ARRAY,
            description: 'A list of 3-5 creative and trending concepts related to the theme.',
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: 'An engaging, SEO-friendly title for the trend concept.'
                    },
                    description: {
                        type: Type.STRING,
                        description: 'A detailed description of the visual trend, including styles, subjects, and composition.'
                    },
                    keywords: {
                        type: Type.ARRAY,
                        description: 'A list of 5-10 highly relevant and trending keywords.',
                        items: { type: Type.STRING }
                    }
                },
                required: ['title', 'description', 'keywords']
            }
        },
        audienceTip: {
            type: Type.STRING,
            description: 'A helpful tip about the target audience for this trend, e.g., "Appeals to Gen Z and eco-conscious consumers."'
        }
    },
    required: ['ideas', 'audienceTip']
};

const keywordStrategyResponseSchema = {
    type: Type.OBJECT,
    properties: {
        primaryKeywords: {
            type: Type.ARRAY,
            description: "A list of 5-7 core, high-volume keywords directly related to the topic.",
            items: { type: Type.STRING }
        },
        longTailKeywords: {
            type: Type.ARRAY,
            description: "A list of 5-7 more specific, multi-word phrases that target niche audiences.",
            items: { type: Type.STRING }
        },
        relatedConcepts: {
            type: Type.ARRAY,
            description: "A list of 5-7 conceptually related terms or LSI keywords that add context.",
            items: { type: Type.STRING }
        }
    },
    required: ['primaryKeywords', 'longTailKeywords', 'relatedConcepts']
};

const stockMetadataResponseSchema = {
    type: Type.OBJECT,
    properties: {
        metadata: {
            type: Type.ARRAY,
            description: "An array of metadata objects for different stock platforms.",
            items: {
                type: Type.OBJECT,
                properties: {
                    platform: {
                        type: Type.STRING,
                        description: "The name of the stock content platform (e.g., 'Adobe Stock')."
                    },
                    title: {
                        type: Type.STRING,
                        description: "An SEO-optimized title for the content on this platform."
                    },
                    keywords: {
                        type: Type.ARRAY,
                        description: "A list of 30-50 relevant and high-traffic keywords, ordered by importance.",
                        items: { type: Type.STRING }
                    }
                },
                required: ['platform', 'title', 'keywords']
            }
        }
    },
    required: ['metadata']
};

export const generateStockMetadata = async (
    topic: string,
    contentType: string,
    image?: { data: string; mimeType: string }
): Promise<StockMetadata[]> => {
    
    let promptText: string;
    const requestContents: { parts: any[] } = { parts: [] };

    const commonInstructions = `
    Generate optimized metadata for the following platforms: Adobe Stock, Shutterstock, Freepik, and Vecteezy.
    
    For each platform:
    1.  Provide one compelling, commercial, and SEO-friendly title.
    2.  Provide a list of 30-50 highly relevant keywords, including primary, long-tail, and conceptual keywords.
    3.  Order the keywords by importance, with the most critical ones first.`;
    
    if (image) {
        promptText = `You are a world-class SEO expert and metadata strategist for stock content platforms. Analyze the provided image, which is a "${contentType}".`;
        if (topic) {
            promptText += ` Use the following user-provided description as an additional hint: "${topic}".`;
        }
        promptText += commonInstructions;
        requestContents.parts.push({ text: promptText });
        requestContents.parts.push({ inlineData: { data: image.data, mimeType: image.mimeType } });
    } else {
        promptText = `You are a world-class SEO expert and metadata strategist for stock content platforms. For the topic "${topic}" and content type "${contentType}", generate optimized metadata.`;
        promptText += commonInstructions;
        requestContents.parts.push({ text: promptText });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: requestContents,
            config: {
                responseMimeType: 'application/json',
                responseSchema: stockMetadataResponseSchema,
                temperature: 0.6,
            },
        });

        const data = JSON.parse(response.text.trim());
        if (!data.metadata || !Array.isArray(data.metadata)) {
            throw new Error("Invalid response structure from AI for stock metadata.");
        }
        return data.metadata as StockMetadata[];
    } catch (error) {
        console.error("Error generating stock metadata:", error);
        throw new Error("Failed to generate stock metadata. Please try another topic or image.");
    }
};

export const getGlobalHotTopics = async (): Promise<HotTopic[]> => {
    const prompt = `As a stock content strategist, identify 5 globally trending topics for visual content (photos, videos, illustrations) right now, based on current news and cultural shifts.
    For each topic, provide a short description of why it's trending. Use Google Search to find the most up-to-date information.
    
    Return the response as a single JSON array inside a markdown code block. Each object in the array should have two keys: "topic" and "reason".`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                temperature: 0.7,
            },
        });

        const rawText = response.text.trim();
        const jsonMatch = rawText.match(/```(json)?\n([\s\S]*?)\n```/);
        
        let data;
        if (jsonMatch && jsonMatch[2]) {
            data = JSON.parse(jsonMatch[2]);
        } else {
             try {
                data = JSON.parse(rawText);
            } catch (e) {
                console.error("Failed to parse raw text as JSON for hot topics:", rawText);
                throw new Error("The AI's response for hot topics was not in the expected JSON format.");
            }
        }

        if (!Array.isArray(data)) {
            throw new Error("Invalid response structure from AI for hot topics.");
        }
        return data as HotTopic[];
    } catch (error) {
        console.error("Error getting hot topics:", error);
        if (error instanceof Error && error.message.includes("JSON")) {
            throw error;
        }
        throw new Error("Failed to fetch global hot topics. The AI may be busy.");
    }
};

export const generateKeywordStrategy = async (topic: string): Promise<KeywordStrategy> => {
    const prompt = `You are an SEO expert specializing in stock content. For the topic "${topic}", generate a comprehensive keyword strategy. Provide:
    1.  A list of 5-7 primary keywords.
    2.  A list of 5-7 long-tail keywords.
    3.  A list of 5-7 related concepts or LSI keywords.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: keywordStrategyResponseSchema,
                temperature: 0.5,
            },
        });

        const data = JSON.parse(response.text.trim());
        if (!data.primaryKeywords || !data.longTailKeywords || !data.relatedConcepts) {
            throw new Error("Invalid response structure from AI for keyword strategy.");
        }
        return data as KeywordStrategy;
    } catch (error) {
        console.error("Error generating keyword strategy:", error);
        throw new Error("Failed to generate keyword strategy. Please try another topic.");
    }
};

export const generateInspirationalImage = async (prompt: string, contentType: string): Promise<string> => {
    const imagePrompt = `Create a visually stunning, high-quality ${contentType.toLowerCase()} that embodies the concept: "${prompt}". The image should be inspiring, marketable for stock platforms, and aesthetically pleasing. Avoid text and logos.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: imagePrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
                temperature: 0.9,
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("No image data received from the AI.");

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate AI image. The model may be unavailable.");
    }
};

export const generateInspirationGallery = async (query: string, contentType: string): Promise<string[]> => {
    // Generate 4 images in parallel for a richer inspiration gallery
    const imagePromises = Array(4).fill(null).map(() => 
        generateInspirationalImage(query, contentType)
    );

    try {
        const results = await Promise.all(imagePromises);
        return results;
    } catch (error) {
        console.error("Error generating inspiration gallery:", error);
        // If some images fail, we might still want to return the successful ones,
        // but for simplicity, we'll fail the whole operation if any promise rejects.
        throw new Error("Failed to generate the full inspiration gallery.");
    }
};


export const generateTrendingIdeas = async (theme: string, contentType: string): Promise<AITrendReport> => {
  const prompt = `You are a creative strategist for a major stock content agency.
  Analyze the theme "${theme}" for the content type "${contentType}".
  Generate a trend report that includes 3-5 distinct, actionable, and creative concepts.
  For each concept, provide a compelling title, a description of the visual style and subject matter, and a list of 5-10 relevant keywords.
  Also, provide a single, insightful "Audience Tip" about who this trend might appeal to.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: trendReportResponseSchema,
        temperature: 0.8,
      },
    });

    const data = JSON.parse(response.text.trim());
    if (!data.ideas || !data.audienceTip) {
        throw new Error("Invalid response structure from AI for trends.");
    }
    return data as AITrendReport;
  } catch (error) {
    console.error("Error generating trending ideas:", error);
    throw new Error("Failed to generate AI trend report. Please try another theme.");
  }
};


export const generateContentIdeas = async (eventName: string, contentType: string): Promise<AIContent> => {
  const prompt = `You are an expert creative director for stock content platforms like Adobe Stock and Shutterstock.
  For the event "${eventName}" and content type "${contentType}", generate 5 creative content ideas.
  For each idea, provide a brief description, a list of relevant keywords (5-10), and a suggested SEO-friendly title.
  Also provide a general "Upload Tip" for this type of event.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: contentIdeaResponseSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText);
    
    if (!data.ideas || !data.uploadTip) {
        throw new Error("Invalid response structure from AI.");
    }

    return data as AIContent;

  } catch (error) {
    console.error("Error generating content ideas:", error);
    throw new Error("Failed to generate AI content. Please check your API key and try again.");
  }
};

export const findEvents = async (countryName: string, monthName: string, countryCode: string, year: number): Promise<{ events: Event[], sources: GroundingSource[] }> => {
    const prompt = `You are a helpful assistant for stock content creators. Find a list of major public holidays and notable cultural or seasonal events for ${countryName} occurring in ${monthName} ${year}. 
    
    Return the response as a single JSON object inside a markdown code block. The JSON object must have a single key "events", which is an an array of event objects.
    
    For each event object, provide its name, a brief description, and the exact date in "YYYY-MM-DD" format. 
    
    Only include events that are reasonably well-known and provide good opportunities for stock content.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                temperature: 0.2,
            },
        });

        const rawText = response.text.trim();
        const jsonMatch = rawText.match(/```(json)?\n([\s\S]*?)\n```/);
        
        let data;
        if (jsonMatch && jsonMatch[2]) {
            data = JSON.parse(jsonMatch[2]);
        } else {
            try {
                data = JSON.parse(rawText);
            } catch (e) {
                console.error("Failed to parse raw text as JSON:", rawText);
                throw new Error("Failed to parse the AI's response. It was not in the expected JSON format.");
            }
        }

        const events: Event[] = (data.events || []).map((event: any) => ({
            ...event,
            country: countryCode,
        }));

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: GroundingSource[] = groundingChunks
            .map((chunk: any) => chunk.web && { uri: chunk.web.uri, title: chunk.web.title })
            .filter((source: any): source is GroundingSource => source && source.uri && source.title)
            .filter((value, index, self) =>
                index === self.findIndex((t) => (t.uri === value.uri))
            );

        return { events, sources };

    } catch (error) {
        console.error("Error finding events:", error);
        if (error instanceof SyntaxError) {
             throw new Error("Failed to parse the AI's response. It was not in the expected JSON format.");
        }
        throw new Error("Failed to find events using AI. Please try again.");
    }
};