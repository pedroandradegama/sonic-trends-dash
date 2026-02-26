import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JournalSource {
  name: string
  url: string
}

const JOURNAL_SOURCES: Record<string, JournalSource> = {
  radiographics: {
    name: 'Radiographics',
    url: 'https://pubs.rsna.org/journal/radiographics',
  },
  radiology: {
    name: 'Radiology',
    url: 'https://pubs.rsna.org/journal/radiology',
  },
  ajr: {
    name: 'AJR',
    url: 'https://www.ajronline.org/toc/ajr/current',
  },
  jum: {
    name: 'J Ultrasound Med',
    url: 'https://onlinelibrary.wiley.com/journal/15509613',
  },
  ultrasound_med_biol: {
    name: 'Ultrasound Med Biol',
    url: 'https://www.umbjournal.org/current',
  },
}

// Keywords that indicate an article is about ultrasound
const ultrasoundKeywords = [
  'ultrasound', 'ultrasonography', 'sonography', 'sonographic', 'echography',
  'ecografia', 'ultrassonografia', 'doppler', 'pocus', 'point-of-care',
  'elastography', 'elastografia', 'contrast-enhanced ultrasound', 'ceus',
  'b-mode', 'transducer', 'probe', 'sonogram',
  // Related techniques often used in US context
  'ti-rads', 'tirads', 'bi-rads', 'birads', 'o-rads',
  // Specific US procedures
  'us-guided', 'ultrasound-guided', 'sono-guided',
]

function isUltrasoundArticle(title: string): boolean {
  const lower = title.toLowerCase()
  return ultrasoundKeywords.some(k => lower.includes(k))
}

// Map keywords to subgroups
const subgroupKeywords: Record<string, string[]> = {
  'cabeca-pescoco': ['thyroid', 'tireoide', 'neck', 'pescoço', 'parotid', 'salivary', 'ti-rads', 'tirads', 'head', 'cervical lymph'],
  'mamas': ['breast', 'mama', 'bi-rads', 'birads', 'mammary', 'mastectomy'],
  'medicina-interna': ['abdom', 'liver', 'fígado', 'kidney', 'rim', 'renal', 'spleen', 'baço', 'pancrea', 'gallbladder', 'hepat', 'bowel', 'intestin'],
  'gineco-obst': ['obstetric', 'fetal', 'pregnan', 'gestation', 'ovary', 'ovário', 'uterus', 'útero', 'uterine', 'pelvic', 'endometr'],
  'msk': ['musculoskeletal', 'muscle', 'tendon', 'joint', 'shoulder', 'knee', 'hip', 'ankle', 'elbow', 'wrist'],
  'vascular': ['vascular', 'doppler', 'carotid', 'venous', 'arterial', 'artery', 'thrombosis', 'dvt', 'portal vein'],
}

const tagKeywords = ['TI-RADS', 'BI-RADS', 'Doppler', 'POCUS', 'AI', 'artificial intelligence', 'machine learning', 'deep learning', 'contrast', 'elastography', 'guided', 'biopsy', 'intervention', '3D', '4D', 'COVID', 'pediatric']

function classifySubgroup(title: string): string {
  const lowerTitle = title.toLowerCase()
  for (const [subgroup, keywords] of Object.entries(subgroupKeywords)) {
    if (keywords.some(k => lowerTitle.includes(k.toLowerCase()))) {
      return subgroup
    }
  }
  return 'outros'
}

function extractTags(title: string): string[] {
  const tags: string[] = []
  const lowerTitle = title.toLowerCase()
  for (const tag of tagKeywords) {
    if (lowerTitle.includes(tag.toLowerCase())) {
      tags.push(tag.toUpperCase())
    }
  }
  return tags
}

async function translateTitles(titles: string[]): Promise<string[]> {
  if (titles.length === 0) return []
  
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) {
    console.log('LOVABLE_API_KEY not found, skipping translation')
    return titles
  }

  try {
    const numberedTitles = titles.map((t, i) => `${i + 1}. ${t}`).join('\n')
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          {
            role: 'system',
            content: 'Você é um tradutor médico especializado. Traduza os títulos de artigos científicos do inglês para o português brasileiro. Mantenha termos técnicos médicos consagrados (ex: Doppler, TI-RADS, BI-RADS, POCUS). Retorne APENAS os títulos traduzidos, um por linha, numerados exatamente como recebidos. Não adicione explicações.'
          },
          {
            role: 'user',
            content: `Traduza estes títulos para português:\n\n${numberedTitles}`
          }
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      console.error('Translation API error:', response.status)
      return titles
    }

    const data = await response.json()
    const translated = data.choices?.[0]?.message?.content?.trim() || ''
    
    // Parse numbered lines
    const lines = translated.split('\n').filter((l: string) => l.trim())
    const result: string[] = []
    
    for (let i = 0; i < titles.length; i++) {
      const line = lines[i]
      if (line) {
        // Remove numbering prefix like "1. " or "1) "
        const cleaned = line.replace(/^\d+[\.\)]\s*/, '').trim()
        result.push(cleaned || titles[i])
      } else {
        result.push(titles[i])
      }
    }
    
    return result
  } catch (error) {
    console.error('Translation error:', error)
    return titles
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { sourceKey, customUrl, maxArticles } = await req.json()

    const source = JOURNAL_SOURCES[sourceKey]
    const targetUrl = customUrl || source?.url
    const sourceName = source?.name || sourceKey || 'Custom'

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid source or URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Scraping ${sourceName} from ${targetUrl}`)

    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ['links', 'markdown'],
        onlyMainContent: true,
      }),
    })

    const scrapeData = await scrapeResponse.json()

    if (!scrapeResponse.ok) {
      console.error('Firecrawl error:', scrapeData)
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || `Firecrawl error: ${scrapeResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || ''
    const links = scrapeData.data?.links || scrapeData.links || []

    const articlePattern = /\[([^\]]{15,})\]\((https?:\/\/[^)]+)\)/g
    const rawArticles: { title: string; url: string }[] = []
    let match

    while ((match = articlePattern.exec(markdown)) !== null) {
      const title = match[1].trim()
      const url = match[2].trim()
      
      const lowerTitle = title.toLowerCase()
      if (
        title.length > 30 &&
        !lowerTitle.includes('sign in') &&
        !lowerTitle.includes('subscribe') &&
        !lowerTitle.includes('cookie') &&
        !lowerTitle.includes('privacy') &&
        !lowerTitle.includes('terms of') &&
        !lowerTitle.includes('menu') &&
        !lowerTitle.includes('navigation') &&
        !lowerTitle.startsWith('see the invited') &&
        !lowerTitle.startsWith('see the ') &&
        !/^[A-Z][a-z]+ [A-Z]/.test(title.trim()) &&
        (url.includes('/doi/') || url.includes('/article/') || url.includes('/abs/') || url.includes('/full/') || url.includes('/pdf/'))
      ) {
        rawArticles.push({ title, url })
      }
    }

    for (const link of links) {
      if (
        typeof link === 'string' && 
        (link.includes('/doi/') || link.includes('/article/') || link.includes('/abs/')) &&
        !rawArticles.some(a => a.url === link)
      ) {
        rawArticles.push({ title: link.split('/').pop()?.replace(/-/g, ' ') || 'Article', url: link })
      }
    }

    // Filter only ultrasound-related articles
    // For journals that are 100% ultrasound (jum, ultrasound_med_biol), keep all
    const isUltrasoundJournal = ['jum', 'ultrasound_med_biol'].includes(sourceKey)
    const filteredArticles = isUltrasoundJournal 
      ? rawArticles 
      : rawArticles.filter(a => isUltrasoundArticle(a.title))

    console.log(`Found ${rawArticles.length} total articles, ${filteredArticles.length} ultrasound-related`)

    const maxToProcess = maxArticles || 30
    const toProcess = filteredArticles.slice(0, maxToProcess)

    // Translate titles to Portuguese
    const originalTitles = toProcess.map(a => a.title)
    const translatedTitles = await translateTitles(originalTitles)

    // Insert into database
    let inserted = 0
    let skipped = 0
    const insertedArticles: { title: string; url: string; subgroup: string }[] = []

    for (let i = 0; i < toProcess.length; i++) {
      const article = toProcess[i]
      const translatedTitle = translatedTitles[i] || article.title
      const subgroup = classifySubgroup(article.title) // classify on original English title
      const tags = extractTags(article.title)

      const { error } = await supabase
        .from('ultrasound_articles')
        .upsert({
          url: article.url,
          title: translatedTitle,
          source: sourceName,
          publication_date: new Date().toISOString().split('T')[0],
          subgroup,
          tags,
        }, {
          onConflict: 'url',
          ignoreDuplicates: true,
        })

      if (error) {
        console.log(`Error inserting: ${error.message}`)
        skipped++
      } else {
        inserted++
        insertedArticles.push({ title: translatedTitle, url: article.url, subgroup })
      }
    }

    console.log(`Done: ${inserted} inserted, ${skipped} skipped`)

    return new Response(
      JSON.stringify({
        success: true,
        source: sourceName,
        found: rawArticles.length,
        ultrasoundFiltered: filteredArticles.length,
        processed: toProcess.length,
        inserted,
        skipped,
        articles: insertedArticles,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
