import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Itinerary, Activity, UserPreferences, ChatMessage, Accommodation } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Schemas ---

const CoordinatesSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    lat: { type: Type.NUMBER },
    lng: { type: Type.NUMBER },
  },
  required: ["lat", "lng"],
};

const ActivitySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    time: { type: Type.STRING, description: "e.g., '09:00 - 10:30'" },
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    location: { type: Type.STRING },
    price: { type: Type.STRING },
    duration: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['activity', 'meal', 'travel'] },
    openingHours: { type: Type.STRING, description: "e.g. '9 AM - 5 PM' or 'Open 24 hours'" },
    bookingInfo: { type: Type.STRING, description: "Booking requirements or official URL if known" },
    rating: { type: Type.NUMBER, description: "Estimated rating 1-5 based on popularity" },
    coordinates: CoordinatesSchema,
  },
  required: ["time", "name", "description", "location", "type"],
};

const AccommodationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    description: { type: Type.STRING },
    price: { type: Type.STRING },
    location: { type: Type.STRING },
    bookingLink: { type: Type.STRING, description: "Generic booking search link or official site" },
    coordinates: CoordinatesSchema,
  },
  required: ["name", "description", "price", "location"],
};

const StatsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    totalTravelTime: { type: Type.STRING },
    totalCost: { type: Type.STRING },
    activityCount: { type: Type.NUMBER },
  },
  required: ["totalTravelTime", "totalCost", "activityCount"],
};

const DayPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dayNumber: { type: Type.INTEGER },
    summary: { type: Type.STRING },
    accommodation: AccommodationSchema,
    activities: { type: Type.ARRAY, items: ActivitySchema },
    stats: StatsSchema,
  },
  required: ["dayNumber", "summary", "accommodation", "activities", "stats"],
};

const ItinerarySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    days: { type: Type.ARRAY, items: DayPlanSchema },
  },
  required: ["days"],
};

const AlternativesSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        alternatives: { type: Type.ARRAY, items: ActivitySchema }
    },
    required: ["alternatives"]
}

const AccommodationAlternativesSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        alternatives: { type: Type.ARRAY, items: AccommodationSchema }
    },
    required: ["alternatives"]
}

// --- Helpers ---

const generateImageUrl = (name: string, location: string, type: string) => {
    const safeName = name.replace(/Visit|Tour|Walk|to|the|at/gi, '').trim();
    const keywords = [safeName, location].filter(Boolean).join(',');
    const randomSeed = Math.floor(Math.random() * 10000);
    return `https://loremflickr.com/500/350/${encodeURIComponent(keywords)}/all?lock=${randomSeed}`;
};

// --- API Functions ---

export const generateItinerary = async (prefs: UserPreferences): Promise<Itinerary> => {
  const prompt = `
    Create a detailed ${prefs.duration}-day travel itinerary for a trip to ${prefs.destination}.
    Travelers: ${prefs.travelers} (${prefs.hasChildren ? "Includes Children" : "Adults only"}).
    Interests: ${prefs.interests.join(", ")}.

    Requirements:
    1. Realistic travel times between locations. Insert 'travel' type activities between locations with estimated duration.
    2. Detailed 'openingHours' (e.g. '09:00 - 17:00'), 'bookingInfo' (provide a real URL if possible or specific advice), and 'rating' (1-5).
    3. Suggest one specific accommodation for each day.
    4. Provide specific costs.
    5. **Crucial**: Provide accurate 'coordinates' (lat, lng) for every activity and accommodation so they can be plotted on a map.
    
    Format response as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ItinerarySchema,
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return {
        ...prefs,
        days: parsed.days.map((day: any) => ({
          ...day,
          accommodation: {
             ...day.accommodation,
             id: crypto.randomUUID(),
             imageUrl: generateImageUrl(day.accommodation.name, prefs.destination, 'hotel')
          },
          activities: day.activities.map((act: any) => ({
            ...act,
            id: crypto.randomUUID(),
            imageUrl: generateImageUrl(act.name, act.location || prefs.destination, act.type)
          }))
        }))
      };
    }
    throw new Error("No response from Gemini");
  } catch (error) {
    console.error("Error generating itinerary:", error);
    throw error;
  }
};

export const suggestAlternatives = async (originalActivity: Activity, prefs: UserPreferences): Promise<Activity[]> => {
  const prompt = `
    Suggest 3 distinct alternatives to this activity: "${originalActivity.name}" in ${prefs.destination}.
    Original Type: ${originalActivity.type}.
    User Interests: ${prefs.interests.join(", ")}.
    
    Ensure they fit a similar time slot and location.
    Provide 'coordinates' (lat, lng).
    Return JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: AlternativesSchema,
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return parsed.alternatives.map((act: any) => ({
        ...act,
        id: crypto.randomUUID(),
        imageUrl: generateImageUrl(act.name, act.location || prefs.destination, act.type)
      }));
    }
    throw new Error("Failed to generate alternatives");
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const suggestAccommodationAlternatives = async (originalAcc: Accommodation, prefs: UserPreferences): Promise<Accommodation[]> => {
    const prompt = `
      Suggest 3 alternative accommodations to: "${originalAcc.name}" in ${prefs.destination}.
      Price range: Similar or slightly varied.
      Provide 'coordinates' (lat, lng).
      Return JSON.
    `;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: AccommodationAlternativesSchema,
        },
      });
  
      if (response.text) {
        const parsed = JSON.parse(response.text);
        return parsed.alternatives.map((acc: any) => ({
          ...acc,
          id: crypto.randomUUID(),
          imageUrl: generateImageUrl(acc.name, acc.location || prefs.destination, 'hotel')
        }));
      }
      throw new Error("Failed to generate accommodation alternatives");
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

export const chatWithGemini = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are a helpful travel assistant. Keep answers concise."
    }
  });
  
  for (const msg of history) {
    if (msg.role === 'user') await chat.sendMessage({ message: msg.text });
  }

  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "I couldn't process that.";
};

export const analyzeImageWithGemini = async (base64Image: string, promptText: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: promptText || "Analyze this image for travel context." }
        ]
      }
    });
    return response.text || "No analysis available.";
  } catch (error) {
    return "Failed to analyze image.";
  }
};