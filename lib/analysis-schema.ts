import { z } from 'zod'

export const MODEL_ID = 'google/gemini-3.5-flash'
export const MAX_FILE_BYTES = 10 * 1024 * 1024

export const reportAnalysisSchema = z.object({
  summary: z.string().describe('Plain-language summary of the report in 2-4 sentences.'),
  overallStatus: z.enum(['normal', 'attention', 'critical']),
  keyFindings: z.array(z.string()).describe('Short bullet findings, e.g. "Hemoglobin - slightly low".'),
  values: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
        unit: z.string(),
        referenceRange: z.string(),
        status: z.enum(['low', 'normal', 'high']),
      }),
    )
    .describe('Measured values found in the report.'),
  recommendations: z.array(z.string()).describe('Gentle next steps, always including consulting a doctor.'),
})

export const imageAnalysisSchema = z.object({
  imageType: z.string().describe('Detected image modality, e.g. "Chest X-Ray".'),
  summary: z.string().describe('Cautious, plain-language description of what is visible.'),
  keyFindings: z.array(z.string()),
  areasOfAttention: z.array(z.string()).describe('Areas that may warrant professional review.'),
  questionsForDoctor: z.array(z.string()),
})

export type ReportAnalysis = z.infer<typeof reportAnalysisSchema>
export type ImageAnalysis = z.infer<typeof imageAnalysisSchema>
