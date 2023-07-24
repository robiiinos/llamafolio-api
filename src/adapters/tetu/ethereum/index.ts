import { getTetuVaultBalances } from '@adapters/tetu/common/farm'
import { getTetuVaults } from '@adapters/tetu/common/vault'
import type { BaseContext, Contract, GetBalancesHandler } from '@lib/adapter'
import { resolveBalances } from '@lib/balance'

const factory: Contract = {
  chain: 'ethereum',
  address: '0xb8bA82F19A9Be6CbF6DAF9BF4FBCC5bDfCF8bEe6',
}

export const getContracts = async (ctx: BaseContext) => {
  const vaults = await getTetuVaults(ctx, factory)

  return {
    contracts: { vaults },
  }
}

export const getBalances: GetBalancesHandler<typeof getContracts> = async (ctx, contracts) => {
  const balances = await resolveBalances<typeof getContracts>(ctx, contracts, {
    vaults: getTetuVaultBalances,
  })

  return {
    groups: [{ balances }],
  }
}