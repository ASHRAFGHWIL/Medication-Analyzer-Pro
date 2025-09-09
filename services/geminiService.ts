import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const medicationAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    medications: {
      type: Type.ARRAY,
      description: "Detailed information for each medication provided.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The common brand or generic name of the medication.",
          },
          form: {
            type: Type.STRING,
            description: "The physical form of the medication (e.g., Tablet, Capsule, Injection, Ointment).",
          },
          description: {
            type: Type.STRING,
            description: "A brief description of the medication's appearance and primary function.",
          },
          indications: {
            type: Type.ARRAY,
            description: "A list of primary conditions or symptoms this medication is used to treat.",
            items: { type: Type.STRING },
          },
          methodOfUse: {
            type: Type.STRING,
            description: "Instructions on how to properly take or use the medication (e.g., with food, at night).",
          },
          sideEffects: {
            type: Type.ARRAY,
            description: "A list of common potential side effects, categorized by severity.",
            items: {
              type: Type.OBJECT,
              properties: {
                  symptom: { type: Type.STRING },
                  severity: { type: Type.STRING, description: "e.g., Common, Rare, Severe"}
              }
            },
          },
          dosage: {
            type: Type.OBJECT,
            description: "Recommended dosage information and the clinical reasoning behind it.",
            properties: {
              recommendation: {
                type: Type.STRING,
                description: "The appropriate dosage for a typical adult patient.",
              },
              reasoning: {
                type: Type.STRING,
                description: "The medical or pharmacological reason for the recommended dosage.",
              },
            },
          },
        },
        required: ["name", "form", "description", "indications", "methodOfUse", "sideEffects", "dosage"],
      },
    },
    interactions: {
      type: Type.ARRAY,
      description: "Analysis of potential interactions between the listed medications.",
      items: {
        type: Type.OBJECT,
        properties: {
          medications: {
            type: Type.ARRAY,
            description: "The pair of medications that interact.",
            items: { type: Type.STRING },
          },
          severity: {
            type: Type.STRING,
            description: "The potential severity of the interaction (e.g., 'Minor', 'Moderate', 'Major', 'Life-threatening').",
          },
          description: {
            type: Type.STRING,
            description: "A detailed explanation of the interaction, its mechanism, and potential consequences.",
          },
        },
        required: ["medications", "severity", "description"],
      },
    },
  },
  required: ["medications", "interactions"],
};

export async function analyzeMedications(meds: string[], language: 'en' | 'ar'): Promise<AnalysisResult> {
  const model = 'gemini-2.5-flash';
  const languageInstruction = language === 'ar' ? 'Provide the entire response in Arabic.' : 'Provide the entire response in English.';

  const prompt = `
    ${languageInstruction}
    Analyze the following list of medications: ${meds.join(', ')}.
    Act as a highly experienced physician providing a comprehensive and professional consultation.
    For each medication, provide:
    1.  A brief description of its form (e.g., Tablet, Capsule).
    2.  Indications for use (what it treats).
    3.  Method of use (how to take it).
    4.  A list of common side effects with their severity.
    5.  Appropriate dosage for a typical adult and a clear, concise reason for that dosage.

    Also, provide a detailed analysis of all potential drug-drug interactions between these medications, including the severity and a description of each interaction.
    If no interactions are found, return an empty array for the interactions field.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: medicationAnalysisSchema,
      },
    });

    const jsonText = response.text.trim();
    const result: AnalysisResult = JSON.parse(jsonText);
    return result;
  } catch (error) {
    console.error("Error in analyzeMedications:", error);
    throw new Error("Failed to get analysis from AI service.");
  }
}

export async function generateMedicationImage(name: string, form: string): Promise<string> {
    const model = 'imagen-4.0-generate-001';
    const prompt = `A professional, photorealistic product image of a modern medication box for "${name} ${form}". The box should be clean, professionally designed, and sitting on a neutral, brightly lit white background. Focus on making it look like a real, high-quality product photograph.`;

    try {
        const response = await ai.models.generateImages({
            model: model,
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Error in generateMedicationImage:", error);
        throw new Error("Failed to generate medication image.");
    }
}