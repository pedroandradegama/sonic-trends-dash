import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PLUGGY_API = 'https://api.pluggy.ai'

let cachedApiKey: string | null = null
let apiKeyExpiry = 0

async function getApiKey(): Promise<string> {
  if (cachedApiKey && Date.now() < apiKeyExpiry) return cachedApiKey
  const res = await fetch(`${PLUGGY_API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: Deno.env.get('PLUGGY_CLIENT_ID'),
      clientSecret: Deno.env.get('PLUGGY_CLIENT_SECRET'),
    }),
  })
  const data = await res.json()
  cachedApiKey = data.apiKey
  apiKeyExpiry = Date.now() + 90 * 60 * 1000
  return cachedApiKey!
}

async function pluggyGet(path: string, apiKey: string) {
  const res = await fetch(`${PLUGGY_API}${path}`, {
    headers: { 'X-API-KEY': apiKey },
  })
  return res.json()
}

serve(async (req) => {
  const responsePromise = new Response('ok', { status: 200 })

  ;(async () => {
    try {
      const payload = await req.json()
      const { event, itemId } = payload

      console.log('Pluggy webhook:', event, itemId)

      if (!itemId) return
      if (!['item/updated', 'item/created', 'transactions/created'].includes(event)) return

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      const apiKey = await getApiKey()

      const item = await pluggyGet(`/items/${itemId}`, apiKey)
      if (!item?.id) return

      const { data: conn } = await supabase
        .from('fn_bank_connections')
        .select('id, user_id')
        .eq('pluggy_item_id', itemId)
        .maybeSingle()

      if (!conn) {
        const clientUserId = item.clientUserId
        if (!clientUserId) return

        const connectorName = item.connector?.name ?? 'Banco'
        const connectorType = item.connector?.type ?? 'PERSONAL_BANK'

        const { data: newConn } = await supabase
          .from('fn_bank_connections')
          .insert({
            user_id: clientUserId,
            pluggy_item_id: itemId,
            connector_name: connectorName,
            connector_id: item.connector?.id,
            account_type: connectorType,
            status: item.status ?? 'UPDATED',
            last_synced_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (newConn) {
          await syncTransactions(supabase, apiKey, newConn.id, newConn.user_id, itemId)
        }
        return
      }

      await supabase
        .from('fn_bank_connections')
        .update({
          status: item.status ?? 'UPDATED',
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('pluggy_item_id', itemId)

      if (item.status === 'UPDATED') {
        await syncTransactions(supabase, apiKey, conn.id, conn.user_id, itemId)
      }

    } catch (err) {
      console.error('Pluggy webhook processing error:', err)
    }
  })()

  return responsePromise
})

async function syncTransactions(
  supabase: any,
  apiKey: string,
  connectionId: string,
  userId: string,
  itemId: string
) {
  const accountsData = await pluggyGet(`/accounts?itemId=${itemId}`, apiKey)
  const accounts = accountsData.results ?? []

  const { data: services } = await supabase
    .from('fn_services')
    .select('id, name')
    .eq('user_id', userId)

  for (const account of accounts) {
    const since = new Date()
    since.setDate(since.getDate() - 90)
    const sinceStr = since.toISOString().split('T')[0]

    let page = 1
    let hasMore = true

    while (hasMore) {
      const txData = await pluggyGet(
        `/transactions?accountId=${account.id}&from=${sinceStr}&pageSize=500&page=${page}`,
        apiKey
      )
      const txs = txData.results ?? []
      hasMore = page < (txData.totalPages ?? 1)
      page++

      if (txs.length === 0) break

      const rows = txs.map((tx: any) => {
        const isCreditCard = account.subtype === 'CREDIT_CARD' || account.type === 'CREDIT'

        const isIncome = tx.amount > 0 && tx.type !== 'DEBIT'
        let matchedServiceId: string | null = null

        if (isIncome && services) {
          for (const svc of services) {
            const svcNameLower = svc.name.toLowerCase()
            const descLower = (tx.description ?? '').toLowerCase()
            if (descLower.includes(svcNameLower.split(' ')[0]) ||
                descLower.includes(svcNameLower.split(' ').slice(-1)[0])) {
              matchedServiceId = svc.id
              break
            }
          }
        }

        return {
          user_id: userId,
          connection_id: connectionId,
          pluggy_tx_id: tx.id,
          pluggy_account_id: account.id,
          description: tx.description ?? '',
          amount: tx.amount,
          date: tx.date?.split('T')[0] ?? new Date().toISOString().split('T')[0],
          status: tx.status ?? 'POSTED',
          category: tx.category,
          category_id: tx.categoryId,
          merchant_name: tx.merchant?.name ?? null,
          merchant_cnpj: tx.merchant?.cnpj ?? null,
          merchant_category: tx.merchant?.category ?? null,
          is_credit_card: isCreditCard,
          installment_number: tx.creditCardMetadata?.installmentNumber ?? null,
          total_installments: tx.creditCardMetadata?.totalInstallments ?? null,
          total_amount: tx.creditCardMetadata?.totalAmount ?? null,
          bill_id: tx.creditCardMetadata?.billId ?? null,
          card_number: tx.creditCardMetadata?.cardNumber ?? null,
          detected_as_income: isIncome,
          matched_service_id: matchedServiceId,
        }
      })

      if (rows.length > 0) {
        await supabase
          .from('fn_transactions')
          .upsert(rows, { onConflict: 'pluggy_tx_id', ignoreDuplicates: true })
      }
    }
  }

  await rebuildMonthSummary(supabase, userId, new Date())
}

async function rebuildMonthSummary(supabase: any, userId: string, ref: Date) {
  const monthStart = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-01`

  const { data: txs } = await supabase
    .from('fn_transactions')
    .select('amount, category, is_pj_expense, is_credit_card')
    .eq('user_id', userId)
    .gte('date', monthStart)
    .eq('status', 'POSTED')

  if (!txs?.length) return

  let totalSpending = 0
  let totalIncome = 0
  let pjExpenses = 0
  let creditCardTotal = 0
  const byCategory: Record<string, number> = {}

  for (const tx of txs) {
    if (tx.amount < 0) {
      const abs = Math.abs(tx.amount)
      totalSpending += abs
      if (tx.is_credit_card) creditCardTotal += abs
      if (tx.is_pj_expense) pjExpenses += abs
      const cat = tx.category ?? 'Outros'
      byCategory[cat] = (byCategory[cat] ?? 0) + abs
    } else {
      totalIncome += tx.amount
    }
  }

  const savingsRate = totalIncome > 0
    ? Math.round(((totalIncome - totalSpending) / totalIncome) * 100 * 10) / 10
    : null

  await supabase
    .from('fn_spending_summaries')
    .upsert({
      user_id: userId,
      month: monthStart,
      total_spending: Math.round(totalSpending),
      total_income: Math.round(totalIncome),
      savings_rate: savingsRate,
      by_category: byCategory,
      pj_expenses: Math.round(pjExpenses),
      credit_card_total: Math.round(creditCardTotal),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,month' })
}
