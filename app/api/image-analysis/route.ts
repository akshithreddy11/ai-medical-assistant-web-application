import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 500 }
      )
    }

    const supabase = await createSupabaseServerClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please log in before analyzing an image.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const image = body.image
    const mimeType = body.mimeType
    const fileName = body.fileName || 'medical-image.png'

    if (!image || !mimeType) {
      return NextResponse.json(
        { error: 'Image data is required.' },
        { status: 400 }
      )
    }

    if (!['image/jpeg', 'image/png'].includes(mimeType)) {
      return NextResponse.json(
        { error: 'Only JPG, JPEG and PNG images are supported.' },
        { status: 400 }
      )
    }

    const imageBuffer = Buffer.from(image, 'base64')

    if (imageBuffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image must be smaller than 5 MB.' },
        { status: 400 }
      )
    }

    const safeFileName = String(fileName).replace(
      /[^a-zA-Z0-9._-]/g,
      '_'
    )

    const ai = new GoogleGenAI({ apiKey })

    let response

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType,
                data: image,
              },
            },
            {
              text: `
You are an AI medical information assistant.

Carefully describe the uploaded medical image.

Provide the response using these headings:

1. Image Type and Visible Contents

Describe what kind of image was uploaded and what is visibly present.

2. General Observations

Describe only features that are clearly visible.

Do not invent findings or measurements.

3. Limitations

Explain the limitations of image quality and AI-based analysis.

4. When to Consult a Doctor

Explain when the user should seek evaluation from a qualified doctor.

Important instructions:

- Do not provide a definitive diagnosis.
- Do not claim certainty about medical conditions.
- Do not invent findings, values, or measurements.
- If the image is unclear or not medical, explain that clearly.
- Use simple language and clear headings.
- Remind the user that this is informational and not a substitute for professional care.
`,
            },
          ],
        })

        break
      } catch (error: unknown) {
        const errorObject = error as {
          status?: number
          code?: number
          httpStatus?: number
          message?: string
        }

        const status = Number(
          errorObject.status ??
            errorObject.code ??
            errorObject.httpStatus ??
            0
        )

        console.error(
          `Gemini attempt ${attempt + 1} failed:`,
          errorObject.message
        )

        if (status === 503 && attempt < 2) {
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * (attempt + 1))
          )

          continue
        }

        throw error
      }
    }

    const analysis = response?.text

    if (!analysis) {
      return NextResponse.json(
        { error: 'No analysis was returned from Gemini.' },
        { status: 500 }
      )
    }

    const filePath = `${user.id}/${Date.now()}-${safeFileName}`

    const { data: savedImage, error: imageSaveError } = await supabase
      .from('medical_images')
      .insert({
        user_id: user.id,
        file_name: safeFileName,
        file_path: filePath,
        mime_type: mimeType,
        analysis,
      })
      .select('id, file_name, analysis, created_at')
      .single()

    if (imageSaveError) {
      console.error('Image save error:', imageSaveError)

      return NextResponse.json(
        {
          error: `Image analysis completed, but saving failed: ${imageSaveError.message}`,
        },
        { status: 500 }
      )
    }

    await supabase.from('activity_history').insert({
      user_id: user.id,
      activity_type: 'image_analysis',
      description: `Uploaded and analyzed ${safeFileName}`,
      reference_id: savedImage.id,
    })

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Image Analysis Complete',
      message: `Your medical image "${safeFileName}" has been analyzed successfully.`,
      type: 'image',
      is_read: false,
    })

    return NextResponse.json({
      success: true,
      analysis,
      image: savedImage,
    })
  } catch (error: unknown) {
    console.error('Image analysis error:', error)

    const message =
      error instanceof Error
        ? error.message
        : 'Something went wrong while analyzing the image.'

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}