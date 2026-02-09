
import { GoogleGenAI, Type } from "@google/genai";
import { DeviceInfo, ThreatIntelligenceItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SERVICE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    port: { type: Type.NUMBER },
    protocol: { type: Type.STRING },
    name: { type: Type.STRING },
    version: { type: Type.STRING },
    state: { type: Type.STRING },
    vulnerabilities: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          description: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["Critical", "High", "Medium", "Low"] },
          remediation: { type: Type.STRING }
        },
        required: ["id", "description", "severity", "remediation"]
      } 
    }
  },
  required: ["port", "protocol", "name", "version", "state", "vulnerabilities"]
};

const OS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    version: { type: Type.STRING },
    family: { type: Type.STRING },
    confidence: { type: Type.NUMBER }
  },
  required: ["name", "version", "family", "confidence"]
};

const SCAN_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    host: { type: Type.STRING },
    ip: { type: Type.STRING },
    hostingProvider: { type: Type.STRING, description: "E.g. AWS, GCP, Azure, Digital Ocean, Cloudflare, or On-Premise" },
    os: OS_SCHEMA,
    services: {
      type: Type.ARRAY,
      items: SERVICE_SCHEMA
    },
    subdomains: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          host: { type: Type.STRING },
          ip: { type: Type.STRING },
          type: { type: Type.STRING },
          status: { type: Type.STRING, enum: ["online", "offline"] },
          hostingProvider: { type: Type.STRING },
          os: OS_SCHEMA,
          services: { type: Type.ARRAY, items: SERVICE_SCHEMA },
          intelligenceSummary: { type: Type.STRING }
        },
        required: ["host", "ip", "type", "status", "hostingProvider", "os", "services"]
      }
    },
    relatedInfrastructure: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    latency: { type: Type.STRING },
    uptime: { type: Type.STRING },
    macAddress: { type: Type.STRING },
    vendor: { type: Type.STRING },
    intelligenceSummary: { type: Type.STRING }
  },
  required: ["host", "ip", "hostingProvider", "os", "services", "subdomains", "relatedInfrastructure", "latency", "uptime", "intelligenceSummary"]
};

export const generateIntelligenceReport = async (host: string): Promise<DeviceInfo> => {
  const prompt = `Perform a simulated high-fidelity network intelligence scan on the target: "${host}".
  
  You must act as a sophisticated reconnaissance engine. For the main target and EVERY subdomain discovered:
  1. Identify the Hosting Infrastructure (AWS, GCP, Azure, Digital Ocean, Hetzner, etc.).
  2. Perform OS fingerprinting.
  3. Map open ports and service versions.
  4. Perform a simulated subdomain enumeration (at least 3-4 subdomains for large hosts).
  5. For each subdomain, generate its own specific IP address and its own unique set of running services (e.g., an 'api' subdomain might run Node.js/Koa on 443, a 'dev' subdomain might have a filtered SSH port).
  
  Provide realistic data based on modern tech stacks. Return strictly valid JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: SCAN_RESPONSE_SCHEMA,
      },
    });

    return JSON.parse(response.text) as DeviceInfo;
  } catch (error) {
    console.error("Gemini Intelligence Error:", error);
    throw new Error("Failed to generate deep intelligence report.");
  }
};

export const generateThreatIntelligence = async (deviceInfo: DeviceInfo | null): Promise<ThreatIntelligenceItem[]> => {
  const context = deviceInfo 
    ? `Target Profile: OS ${deviceInfo.os.name}, Hosting: ${deviceInfo.hostingProvider}, services: ${deviceInfo.services.map(s => s.name).join(', ')}.`
    : "General global landscape.";

  const prompt = `Generate 4-5 real-world global cyber threat intelligence alerts relevant to the following profile: ${context}. Return as a JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              severity: { type: Type.STRING },
              source: { type: Type.STRING },
              timestamp: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["id", "title", "description", "severity", "source", "timestamp", "tags"]
          }
        },
      },
    });

    return JSON.parse(response.text) as ThreatIntelligenceItem[];
  } catch (error) {
    console.error("Gemini Threat Intel Error:", error);
    return [];
  }
};
