import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const REPORT_PROMPT = `
You are a medical report information assistant.

Read the uploaded medical report and explain its contents in simple language.

Provide these sections:

1. Report Type and Date
Mention the report type and date if visible.

2. Important Test Results
List important test names, values, units, and reference ranges when available.

3. High or Low Values
Mention values marked high, low, abnormal, or outside the reference range.

4. Simple Summary
Explain what the report says in simple language.

5. Questions for the Doctor
Give useful questions the patient may ask their doctor.

Important safety rules:
- Do not invent missing values.
- Do not diagnose diseases.
- Do not recommend medicines or treatment.
- Do not claim certainty about medical conditions.
- Explain when a result cannot be interpreted without medical history.
- If the document is unreadable, say so.
- This is informational support, not a diagnosis.
`

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'Gemini API key is not configured.',
        },
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
        {
          error: 'Please log in before uploading a report.',
        },
        { status: 401 }
      )
    }

    const body = await request.json()

    const file = body.file
    const mimeType = body.mimeType
    const fileName = body.fileName

    if (!file || !mimeType) {
      return NextResponse.json(
        {
          error: 'Please upload a medical report.',
        },
        { status: 400 }
      )
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ]

    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        {
          error:
            'Only PDF, JPG, JPEG, and PNG files are supported.',
        },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(file, 'base64')

    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: 'File must be smaller than 10 MB.',
        },
        { status: 400 }
      )
    }

    const safeFileName = String(
      fileName || 'medical-report'
    ).replace(/[^a-zA-Z0-9._-]/g, '_')

    const ai = new GoogleGenAI({
      apiKey,
    })

    let interaction: any = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        interaction = await ai.interactions.create({
          model: 'gemini-3.8-flash',
          input: [
            {
              type: 'text',
              text: REPORT_PROMPT,
            },
            {
              type: 'document',
              data: file,
              mime_type: mimeType,
            },
          ],
        })

        break
      } catch (error: any) {
        const status = Number(
          error?.status ??
            error?.code ??
            error?.httpStatus
        )

        console.error(
          `Gemini report attempt ${attempt} failed:`,
          error?.message || error
        )

        if (status === 503 && attempt < 3) {
          await new Promise((resolve) =>
            setTimeout(resolve, 3000 * attempt)
          )

          continue
        }

        throw error
      }
    }

    const analysis =
      typeof interaction?.output_text === 'string'
        ? interaction.output_text.trim()
        : interaction?.outputs
            ?.map((output: any) => output.text || '')
            .join('\n')
            .trim() || ''

    if (!analysis) {
      return NextResponse.json(
        {
          error:
            'Gemini did not return a report analysis.',
        },
        { status: 502 }
      )
    }

    // Save file to Supabase Storage
    const filePath = `${user.id}/${Date.now()}-${safeFileName}`

    const { error: uploadError } =
      await supabase.storage
        .from('medical-reports')
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: false,
        })

    if (uploadError) {
      console.error(
        'REPORT STORAGE ERROR:',
        uploadError
      )

      return NextResponse.json(
        {
          error:
            `Report storage failed: ${uploadError.message}`,
        },
        { status: 500 }
      )
    }

    // Save report analysis
    const {
      data: savedReport,
      error: reportSaveError,
    } = await supabase
      .from('medical_reports')
      .insert({
        user_id: user.id,
        file_name: safeFileName,
        file_path: filePath,
        mime_type: mimeType,
        analysis,
      })
      .select(
        'id, file_name, file_path, analysis, created_at'
      )
      .single()

    if (reportSaveError) {
      console.error(
        'MEDICAL REPORT DATABASE ERROR:',
        reportSaveError
      )

      return NextResponse.json(
        {
          error:
            `Report analysis completed, but saving failed: ${reportSaveError.message}`,
        },
        { status: 500 }
      )
    }

    // Save History
    const { error: activityError } =
      await supabase
        .from('activity_history')
        .insert({
          user_id: user.id,
          activity_type: 'report_analysis',
          description: `Uploaded and analyzed ${safeFileName}`,
          reference_id: savedReport.id,
        })

    if (activityError) {
      console.error(
        'ACTIVITY HISTORY ERROR:',
        activityError
      )

      return NextResponse.json(
        {
          error:
            `Report saved, but history could not be saved: ${activityError.message}`,
        },
        { status: 500 }
      )
    }

    // Create Notification
    const { error: notificationError } =
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Report Analysis Complete',
          message: `Your medical report "${safeFileName}" has been analyzed successfully.`,
          type: 'report',
          is_read: false,
        })

    if (notificationError) {
      console.error(
        'NOTIFICATION ERROR:',
        notificationError
      )

      return NextResponse.json(
        {
          error:
            `Report saved, but notification could not be created: ${notificationError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      analysis,
      fileName: safeFileName,
      filePath,
      reportId: savedReport.id,
    })
  } catch (error: any) {
    console.error(
      'REPORT ANALYSIS ERROR:',
      error
    )

    const status = Number(
      error?.status ??
        error?.code ??
        error?.httpStatus
    )

    const message =
      error instanceof Error
        ? error.message
        : 'Unknown error'

    if (status === 503) {
      return NextResponse.json(
        {
          error:
            'Gemini is temporarily overloaded. Please wait a little and try again.',
        },
        { status: 503 }
      )
    }

    if (status === 429) {
      return NextResponse.json(
        {
          error:
            'Gemini API quota or rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      )
    }

    if (status === 404) {
      return NextResponse.json(
        {
          error:
            'The configured Gemini model or API endpoint is unavailable for this API key.',
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 }
    )
  }
}