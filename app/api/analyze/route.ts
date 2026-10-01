import { generateText, Output } from 'ai'
import { imageAnalysisSchema, MAX_FILE_BYTES, MODEL_ID, reportAnalysisSchema } from '@/lib/analysis-schema'

export const maxDuration = 60

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const REPORT_TYPES = ['application/pdf', ...IMAGE_TYPES]

const PROMPTS = {
  report:
    'Analyze this medical report (lab results, prescription, or similar). Extract every measured value with its unit and reference range, flag abnormal values, and summarize in plain language for a non-expert. Do not diagnose. If the document is not a medical report, say so in the summary and return empty lists.',
  image:
    'You are assisting a patient in understanding a medical image (X-ray, CT, MRI, ultrasound, or skin photo). Describe cautiously what is visible, note areas that may warrant attention by a radiologist or doctor, and suggest questions for their doctor. Never give a definitive diagnosis. If this is not a medical image, say so in the summary and return empty lists.',
} as const

export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file')
  const kind = form.get('kind')

  if (kind !== 'report' && kind !== 'image') {
    return Response.json({ error: 'Invalid analysis type.' }, { status: 400 })
  }
  if (!(file instanceof File)) {
    return Response.json({ error: 'No file uploaded.' }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: 'File exceeds the 10MB limit.' }, { status: 413 })
  }
  const allowed = kind === 'image' ? IMAGE_TYPES : REPORT_TYPES
  if (!allowed.includes(file.type)) {
    return Response.json({ error: 'Unsupported file type.' }, { status: 415 })
  }

  try {
    const data = new Uint8Array(await file.arrayBuffer())
    const { output } = await generateText({
      model: MODEL_ID,
      output: Output.object({ schema: kind === 'report' ? reportAnalysisSchema : imageAnalysisSchema }),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPTS[kind] },
            { type: 'file', mediaType: file.type, data, filename: file.name },
          ],
        },
      ],
    })
    return Response.json({ kind, fileName: file.name, analysis: output })
  } catch (error) {
    console.error('[v0] analyze failed:', error)
    return Response.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
