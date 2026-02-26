import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JournalSource {
  name: string
  url: string
  searchPath?: string
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

    // Use Firecrawl to scrape the journal page
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

    // Extract article links and titles from the scraped content
    const markdown = scrapeData.data?.markdown || scrapeData.markdown || ''
    const links = scrapeData.data?.links || scrapeData.links || []

    // Parse markdown for article titles and links
    // Pattern: find markdown links [title](url)
    const articlePattern = /\[([^\]]{15,})\]\((https?:\/\/[^)]+)\)/g
    const articles: { title: string; url: string }[] = []
    let match

    while ((match = articlePattern.exec(markdown)) !== null) {
      const title = match[1].trim()
      const url = match[2].trim()
      
      // Filter out navigation, menu items, author names, commentary refs
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
        // Filter author-only links (typically just names with no other words)
        !/^[A-Z][a-z]+ [A-Z]/.test(title.trim()) &&
        // Must contain at least one article-like URL pattern
        (url.includes('/doi/') || url.includes('/article/') || url.includes('/abs/') || url.includes('/full/') || url.includes('/pdf/'))
      ) {
        articles.push({ title, url })
      }
    }

    // Also check standalone links that might be articles
    for (const link of links) {
      if (
        typeof link === 'string' && 
        (link.includes('/doi/') || link.includes('/article/') || link.includes('/abs/')) &&
        !articles.some(a => a.url === link)
      ) {
        articles.push({ title: link.split('/').pop()?.replace(/-/g, ' ') || 'Article', url: link })
      }
    }

    const maxToProcess = maxArticles || 30
    const toProcess = articles.slice(0, maxToProcess)

    console.log(`Found ${articles.length} potential articles, processing ${toProcess.length}`)

    // Insert into database
    let inserted = 0
    let skipped = 0
    const insertedArticles: { title: string; url: string; subgroup: string }[] = []

    for (const article of toProcess) {
      const subgroup = classifySubgroup(article.title)
      const tags = extractTags(article.title)

      const { error } = await supabase
        .from('ultrasound_articles')
        .upsert({
          url: article.url,
          title: article.title,
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
        insertedArticles.push({ title: article.title, url: article.url, subgroup })
      }
    }

    console.log(`Done: ${inserted} inserted, ${skipped} skipped`)

    return new Response(
      JSON.stringify({
        success: true,
        source: sourceName,
        found: articles.length,
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
