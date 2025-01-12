import type { BaseContext, Contract } from '@lib/adapter'
import { mapSuccessFilter } from '@lib/array'
import { multicall } from '@lib/multicall'

const abi = {
  asset: {
    inputs: [],
    name: 'asset',
    outputs: [{ internalType: 'contract ERC20', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
} as const

export async function getSommelierContracts(ctx: BaseContext, pools: Contract[]) {
  const underlyings = await multicall({ ctx, calls: pools.map((pool) => ({ target: pool.address })), abi: abi.asset })

  const contracts: Contract[] = mapSuccessFilter(underlyings, (res, idx) => ({
    ...pools[idx],
    underlyings: [res.output],
  }))

  return contracts
}
