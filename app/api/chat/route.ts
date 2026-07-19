import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { verifyCook } from '@/lib/agents/cookVerificationAgent'
import { sendNewJobNotification } from '@/lib/email'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const SYSTEM_PROMPT = `You are the friendly assistant for Sivan Cooks — a platform that connects home cooks with families and event hosts in the Bay Area, California.

Start by greeting the visitor warmly and asking: "Are you looking to hire a cook for your home, or are you interested in offering your cooking services?"

━━━ COOK SIGNUP PATH ━━━
Collect these conversationally (1-2 questions per message):
1. Full name
2. Email address
3. Phone number (this will also be their WhatsApp contact)
4. City — must be one of: Fremont, Newark, Union City, Milpitas
5. Cuisine types (e.g. South Indian, Tamil, Gujarati, North Indian, Punjabi, Bengali, etc.)
6. Dietary specialties — ask which apply: Vegetarian, Non-Vegetarian
7. Years of cooking experience (a number)
8. A brief introduction about themselves as a cook (2-3 sentences — help them craft one if needed)

Before calling the tool: Read back a clear summary and ask "Does this look correct? Ready for me to submit your application?"

━━━ CLIENT JOB POSTING PATH ━━━
Collect these conversationally (1-2 questions per message):
1. Full name
2. Email address
3. Phone number
4. City — must be one of: Fremont, Newark, Union City, Milpitas
5. Date needed (ask for a specific date, convert to YYYY-MM-DD format)
6. Number of people (between 2 and 14)
7. Is this a Regular Meal or a Festival / Special Occasion?
8. Dietary requirements — Vegetarian, Non-Vegetarian, or None
9. Groceries — will the client have everything ready, does the cook need to pick up groceries, or should the cook bring all ingredients?
10. Does the cook need to clean up afterward? (yes/no)
11. Roughly how many dishes to prepare (e.g. 3 or 4)
12. How many hours will the cook need? (minimum 2)
13. Brief description of what they'd like the cook to prepare

Infer job_category from number of people:
- 2–5 → "family_cooking"
- 6–10 → "small_event"
- 11–14 → "medium_event"

For occasion field use exactly: "Regular Meal" or "Festival / Occasion"

Before calling the tool: Read back a clear summary and ask "Does this look right? Ready to post this job?"

━━━ RULES ━━━
- Keep responses SHORT (2-4 sentences max)
- Ask at most 2 questions per message
- Service areas: Fremont, Newark, Union City, Milpitas ONLY — if asked about another city, apologise and explain we only serve these Bay Area cities currently
- Be warm, encouraging, and concise
- Format all dates as YYYY-MM-DD before calling tools
- Only call a tool AFTER the user has confirmed the summary`

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'create_cook_application',
    description: 'Submit a cook application. Call only after the user confirms the summary of their details.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        city: { type: 'string' },
        cuisine_types: { type: 'array', items: { type: 'string' } },
        dietary_specialties: { type: 'array', items: { type: 'string' } },
        years_experience: { type: 'number' },
        intro: { type: 'string', description: 'Their personal introduction / bio' },
      },
      required: ['name', 'email', 'phone', 'city', 'cuisine_types', 'years_experience', 'intro'],
    },
  },
  {
    name: 'create_job_post',
    description: 'Create a job posting on the platform. Call only after the user confirms the summary.',
    input_schema: {
      type: 'object' as const,
      properties: {
        client_name: { type: 'string' },
        client_email: { type: 'string' },
        client_phone: { type: 'string' },
        city: { type: 'string' },
        job_category: { type: 'string', enum: ['family_cooking', 'small_event', 'medium_event'] },
        occasion: { type: 'string', enum: ['Regular Meal', 'Festival / Occasion'] },
        requested_date: { type: 'string', description: 'YYYY-MM-DD format' },
        num_people: { type: 'number' },
        dietary_restrictions: { type: 'array', items: { type: 'string' } },
        grocery_situation: {
          type: 'string',
          enum: ['client_has_everything', 'need_grocery_pickup', 'cook_brings_ingredients'],
        },
        cleanup_needed: { type: 'boolean' },
        num_dishes: { type: 'number' },
        expected_duration_hours: { type: 'number' },
        text_description: { type: 'string' },
      },
      required: [
        'client_name', 'client_email', 'client_phone', 'city', 'job_category', 'occasion',
        'requested_date', 'num_people', 'grocery_situation', 'num_dishes', 'expected_duration_hours',
      ],
    },
  },
]

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  const supabase = getSupabase()

  if (name === 'create_cook_application') {
    const bio = String(input.intro || '')
    const tagline = bio.split(/[.!?]/)[0].trim().substring(0, 120) || `Home Cook in ${input.city}`

    const { data: cook, error } = await supabase
      .from('cooks')
      .insert({
        name: input.name,
        email: input.email,
        phone: input.phone,
        whatsapp: input.phone,
        bio,
        tagline,
        video_url: null,
        photo_url: null,
        cuisine_types: input.cuisine_types,
        dietary_specialties: (input.dietary_specialties as string[]) || [],
        occasion_types: ['Daily Meals / Tiffin', 'Weekend Family Cooking', 'Festival / Occasion', 'Dinner Party'],
        languages: ['English'],
        price_min: 0,
        price_max: 0,
        price_unit: 'hourly',
        min_hours: null,
        service_areas: [input.city],
        group_size_min: 2,
        group_size_max: 14,
        signature_dishes: '',
        years_experience: input.years_experience,
        available_recurring: false,
        recurring_options: [],
        job_categories: ['family_cooking', 'small_event', 'medium_event'],
        does_cleanup: true,
        grocery_pickup: false,
        grocery_pickup_charge: null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('[Chat] Cook insert failed:', error)
      return `Error: ${error.message}`
    }

    await Promise.all([
      supabase.from('cook_verifications').insert({ cook_id: cook.id }),
      supabase.from('cook_scores').insert({ cook_id: cook.id }),
    ])

    verifyCook({ cook_id: cook.id, name: cook.name, email: cook.email })
      .catch(err => console.error('[Chat] verifyCook failed:', err))

    return `Cook application submitted successfully. Cook ID: ${cook.id}`
  }

  if (name === 'create_job_post') {
    const { data: job, error } = await supabase
      .from('job_posts')
      .insert({
        client_name: input.client_name,
        client_email: input.client_email,
        client_phone: input.client_phone,
        job_category: input.job_category,
        occasion: input.occasion,
        specific_dishes: null,
        num_dishes: input.num_dishes,
        requested_date: input.requested_date,
        requested_time: null,
        expected_duration_hours: input.expected_duration_hours,
        num_people: input.num_people,
        dietary_restrictions: (input.dietary_restrictions as string[]) || [],
        grocery_situation: input.grocery_situation,
        cleanup_needed: input.cleanup_needed ?? false,
        kitchen_access_time: null,
        city: input.city,
        parking_available: false,
        language_preferred: null,
        recurring: false,
        text_description: input.text_description || '',
        voice_memo_url: null,
        additional_notes: null,
        status: 'open',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Chat] Job post insert failed:', error)
      return `Error: ${error.message}`
    }

    const { data: cooks } = await supabase
      .from('cooks')
      .select('id, name, email')
      .eq('status', 'active')

    for (const cook of cooks || []) {
      sendNewJobNotification({
        cookName: cook.name,
        cookEmail: cook.email,
        cookId: cook.id,
        jobId: job.id,
        jobCategory: String(input.job_category),
        occasion: String(input.occasion),
        city: String(input.city),
        numPeople: Number(input.num_people),
        needsGrocery: input.grocery_situation === 'need_grocery_pickup',
        needsCleanup: Boolean(input.cleanup_needed),
      }).catch(err => console.error(`[Chat] Cook notification failed for ${cook.email}:`, err))
    }

    return `Job post created successfully. Job ID: ${job.id}`
  }

  return 'Unknown tool'
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json()

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    })

    if (response.stop_reason === 'tool_use') {
      const toolUse = response.content.find(b => b.type === 'tool_use') as Anthropic.ToolUseBlock
      const toolResult = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>)

      const followUp = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages: [
          ...messages,
          { role: 'assistant' as const, content: response.content },
          {
            role: 'user' as const,
            content: [{ type: 'tool_result' as const, tool_use_id: toolUse.id, content: toolResult }],
          },
        ],
      })

      const text = followUp.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined
      return NextResponse.json({ message: text?.text ?? 'Done!' })
    }

    const text = response.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined
    return NextResponse.json({ message: text?.text ?? '' })
  } catch (err) {
    console.error('[Chat API] Error:', err)
    return NextResponse.json(
      { message: 'Sorry, something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
