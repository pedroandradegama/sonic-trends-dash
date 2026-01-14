import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PubMedArticle {
  pmid: string
  title: string
  source: string
  pubDate: string
  url: string
}

// Map keywords to subgroups
const subgroupKeywords: Record<string, string[]> = {
  'cabeca-pescoco': ['thyroid', 'tireoide', 'neck', 'pescoço', 'parotid', 'parótida', 'salivary', 'salivar', 'ti-rads', 'tirads', 'head', 'cabeça', 'cervical lymph', 'linfonodo cervical'],
  'mamas': ['breast', 'mama', 'bi-rads', 'birads', 'mammary', 'mamário', 'mastectomy', 'mastectomia'],
  'medicina-interna': ['abdom', 'liver', 'fígado', 'kidney', 'rim', 'renal', 'spleen', 'baço', 'pancrea', 'gallbladder', 'vesícula', 'hepat', 'bowel', 'intestin'],
  'gineco-obst': ['obstetric', 'obstétric', 'fetal', 'pregnan', 'grávid', 'gestation', 'gestação', 'ovary', 'ovário', 'uterus', 'útero', 'uterine', 'pelvic', 'pélvic', 'endometr'],
  'msk': ['musculoskeletal', 'muscle', 'músculo', 'tendon', 'tendão', 'joint', 'articular', 'shoulder', 'ombro', 'knee', 'joelho', 'hip', 'quadril', 'ankle', 'tornozelo', 'elbow', 'cotovelo', 'wrist', 'punho'],
  'vascular': ['vascular', 'doppler', 'carotid', 'carótida', 'venous', 'venoso', 'arterial', 'artery', 'artéria', 'thrombosis', 'trombose', 'dvt', 'portal vein', 'veia porta']
}

// Extract tags from title
const tagKeywords = ['TI-RADS', 'BI-RADS', 'Doppler', 'POCUS', 'AI', 'artificial intelligence', 'machine learning', 'deep learning', 'contrast', 'elastography', 'elastografia', 'guided', 'guiado', 'biopsy', 'biópsia', 'intervention', 'intervenção', '3D', '4D', 'COVID', 'pediatric', 'pediátric']

function classifySubgroup(title: string): string {
  const lowerTitle = title.toLowerCase()
  
  for (const [subgroup, keywords] of Object.entries(subgroupKeywords)) {
    if (keywords.some(keyword => lowerTitle.includes(keyword.toLowerCase()))) {
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

async function fetchPubMedArticles(searchTerm: string, maxResults: number = 20): Promise<PubMedArticle[]> {
  console.log(`Fetching PubMed articles for: ${searchTerm}`)
  
  // Step 1: Search for article IDs
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchTerm)}&retmax=${maxResults}&sort=date&retmode=json`
  
  console.log(`Search URL: ${searchUrl}`)
  
  const searchResponse = await fetch(searchUrl)
  if (!searchResponse.ok) {
    throw new Error(`PubMed search failed: ${searchResponse.status}`)
  }
  
  const searchData = await searchResponse.json()
  const ids = searchData.esearchresult?.idlist || []
  
  console.log(`Found ${ids.length} article IDs`)
  
  if (ids.length === 0) {
    return []
  }
  
  // Step 2: Fetch article details
  const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
  
  console.log(`Fetch URL: ${fetchUrl}`)
  
  const fetchResponse = await fetch(fetchUrl)
  if (!fetchResponse.ok) {
    throw new Error(`PubMed fetch failed: ${fetchResponse.status}`)
  }
  
  const fetchData = await fetchResponse.json()
  const articles: PubMedArticle[] = []
  
  for (const id of ids) {
    const article = fetchData.result?.[id]
    if (article) {
      articles.push({
        pmid: id,
        title: article.title || 'No title',
        source: article.source || 'PubMed',
        pubDate: article.pubdate || '',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      })
    }
  }
  
  console.log(`Processed ${articles.length} articles`)
  
  return articles
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null
  
  // Try to parse "2024 Jan 15" or "2024 Jan" formats
  const parts = dateStr.split(' ')
  if (parts.length >= 1) {
    const year = parseInt(parts[0])
    if (year >= 1900 && year <= 2100) {
      const months: Record<string, string> = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      }
      
      const month = months[parts[1]] || '01'
      const day = parts[2] ? parts[2].padStart(2, '0') : '01'
      
      return `${year}-${month}-${day}`
    }
  }
  
  return null
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { action, searchTerm, maxResults } = await req.json()
    
    console.log(`Action: ${action}, SearchTerm: ${searchTerm}, MaxResults: ${maxResults}`)

    if (action === 'fetch') {
      // Fetch articles from PubMed
      const term = searchTerm || 'ultrasound OR ultrasonography'
      const articles = await fetchPubMedArticles(term, maxResults || 20)
      
      // Insert new articles into database (skip duplicates)
      let inserted = 0
      let skipped = 0
      
      for (const article of articles) {
        const subgroup = classifySubgroup(article.title)
        const tags = extractTags(article.title)
        const pubDate = parseDate(article.pubDate)
        
        const { error } = await supabase
          .from('ultrasound_articles')
          .upsert({
            url: article.url,
            title: article.title,
            source: article.source,
            publication_date: pubDate,
            subgroup: subgroup,
            tags: tags,
          }, { 
            onConflict: 'url',
            ignoreDuplicates: true 
          })
        
        if (error) {
          console.log(`Error inserting article: ${error.message}`)
          skipped++
        } else {
          inserted++
        }
      }
      
      console.log(`Inserted: ${inserted}, Skipped: ${skipped}`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          fetched: articles.length,
          inserted,
          skipped,
          articles 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (action === 'search') {
      // Just search without inserting
      const articles = await fetchPubMedArticles(searchTerm || 'ultrasound', maxResults || 20)
      
      return new Response(
        JSON.stringify({ success: true, articles }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "fetch" or "search"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})