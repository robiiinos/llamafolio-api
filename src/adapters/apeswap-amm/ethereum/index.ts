import { GetBalancesHandler } from '@lib/adapter'
import { resolveBalances } from '@lib/balance'
import { getPairsContracts } from '@lib/uniswap/v2/factory'
import { getPairsBalances } from '@lib/uniswap/v2/pair'

export const getContracts = async (props: any) => {
  const offset = props.pairOffset || 0
  const limit = 100

  const pairs = await getPairsContracts({
    chain: 'ethereum',
    factoryAddress: '0xBAe5dc9B19004883d0377419FeF3c2C8832d7d7B',
    offset,
    limit,
  })

  return {
    contracts: { pairs },
    revalidate: 60 * 60,
    revalidateProps: {
      pairOffset: offset + limit,
    },
  }
}

export const getBalances: GetBalancesHandler<typeof getContracts> = async (ctx, contracts) => {
  const balances = await resolveBalances<typeof getContracts>(ctx, 'ethereum', contracts, { pairs: getPairsBalances })

  return {
    balances,
  }
}