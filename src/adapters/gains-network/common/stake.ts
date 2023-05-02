import { Balance, BalancesContext, Contract } from '@lib/adapter'
import { call } from '@lib/call'
import { BigNumber } from 'ethers'

const abi = {
  users: {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'users',
    outputs: [
      { internalType: 'uint256', name: 'stakedTokens', type: 'uint256' },
      { internalType: 'uint256', name: 'debtDai', type: 'uint256' },
      { internalType: 'uint256', name: 'stakedNftsCount', type: 'uint256' },
      { internalType: 'uint256', name: 'totalBoostTokens', type: 'uint256' },
      { internalType: 'uint256', name: 'harvestedRewardsDai', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
}

export async function getGainsStakeBalances(ctx: BalancesContext, staker: Contract): Promise<Balance> {
  const underlying = staker.underlyings?.[0] as Contract

  const { output: stakedTokens } = await call({
    ctx,
    target: staker.address,
    params: [ctx.address],
    abi: abi.users,
  })

  return {
    ...staker,
    amount: BigNumber.from(stakedTokens.stakedTokens),
    underlyings: [underlying],
    rewards: undefined,
    category: 'stake',
  }
}