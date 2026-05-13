const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

/**
 * Generate a professional portfolio summary using Gemini API.
 * Gracefully degrades if no API key is set.
 */
export async function generatePortfolioSummary(profile) {
  if (!GEMINI_API_KEY) {
    return generateFallbackSummary(profile)
  }

  const prompt = `You are a professional portfolio writer for college students. 
Based on the following student profile, write a compelling 2-3 sentence professional bio 
that highlights their skills, interests, and achievements. Keep it concise, modern, and impressive.

Student Profile:
- Name: ${profile.full_name}
- Department: ${profile.department || 'Computer Science'}
- Year: ${profile.year ? `Year ${profile.year}` : 'Final Year'}
- Skills: ${(profile.skills || []).join(', ') || 'Not specified'}
- Bio: ${profile.bio || 'Not provided'}

Write only the bio text, no labels or headers.`

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
      }),
    })

    if (!res.ok) throw new Error('Gemini API error')

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || generateFallbackSummary(profile)
  } catch (err) {
    console.warn('[Gemini] Portfolio generation failed, using fallback.', err)
    return generateFallbackSummary(profile)
  }
}

/**
 * Generate skill tags and recommended connections using Gemini.
 */
export async function generateTeamSkills(description) {
  if (!GEMINI_API_KEY) return []

  const prompt = `Extract 3-5 technical skill tags from this project description. 
Return as a comma-separated list of single words or short phrases only.

Description: ${description}`

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 80 },
      }),
    })
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    return text.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5)
  } catch {
    return []
  }
}

function generateFallbackSummary(profile) {
  const name = profile.full_name || 'This student'
  const dept = profile.department || 'their field'
  const skills = (profile.skills || []).slice(0, 3).join(', ')
  const year = profile.year ? `Year ${profile.year}` : 'a dedicated'

  return `${name} is ${year} student passionate about ${dept}${skills ? `, with expertise in ${skills}` : ''}. 
Active in the NHCM community, they contribute to discussions, collaborate on projects, and continuously push the boundaries of their craft.`
}
