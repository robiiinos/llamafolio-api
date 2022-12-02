import { Contract, GetBalancesHandler } from '@lib/adapter'
import { resolveBalances } from '@lib/balance'

import { getFormattedStakeBalance, getStakeBalance } from './stake'

const wMEMO: Contract = {
  name: 'Wrapped MEMO',
  displayName: 'Wrapped MEMO',
  chain: 'avax',
  address: '0x0da67235dd5787d67955420c84ca1cecd4e5bb3b',
  decimals: 18,
  symbol: 'wMEMO ',
}

const wMemoFarm: Contract = {
  name: 'Multirewards',
  chain: 'avax',
  address: '0xC172c84587bEa6d593269bFE08632bf2Da2Bc0f6',
  token: wMEMO,
}

export const getContracts = () => {
  return {
    contracts: { wMEMO, wMemoFarm },
  }
}

export const getBalances: GetBalancesHandler<typeof getContracts> = async (ctx, contracts) => {
  const balances = await resolveBalances<typeof getContracts>(ctx, 'avax', contracts, {
    wMEMO: getFormattedStakeBalance,
    wMemoFarm: getStakeBalance,
  })

  return {
    balances,
  }
}