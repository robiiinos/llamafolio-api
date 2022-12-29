import { GetBalancesHandler } from '@lib/adapter'
import { resolveBalances } from '@lib/balance'

import { getActiveBondsBalances } from './bondNFT'
import { chickenBondManager, getBondNFTContract } from './chickenBondManager'

export const getContracts = async () => {
  const bondNFT = await getBondNFTContract()

  return {
    contracts: { chickenBondManager },
    props: { bondNFT },
  }
}

export const getBalances: GetBalancesHandler<typeof getContracts> = async (ctx, contracts, props) => {
  const balances = await resolveBalances<typeof getContracts>(ctx, 'ethereum', contracts, {
    chickenBondManager: (ctx) => getActiveBondsBalances(ctx, props.bondNFT),
  })

  return {
    balances,
  }
}