import { Balance, BalancesContext, Contract } from '@lib/adapter'
import { call } from '@lib/call'
import { BigNumber } from 'ethers'

export async function getLendingRewardsBalances(
  ctx: BalancesContext,
  incentiveController: Contract,
  rewardToken: Contract,
  contracts: Contract[],
): Promise<Balance[]> {
  const assetsAddressesList: any = contracts
    .filter((contract) => contract.category === 'lend')
    .map((contract) => contract.address)

  const rewards: Balance[] = []

  const userRewardsRes = await call({
    ctx,
    target: incentiveController.address,
    params: [assetsAddressesList, ctx.address],
    abi: {
      inputs: [
        { internalType: 'address[]', name: 'assets', type: 'address[]' },
        { internalType: 'address', name: 'user', type: 'address' },
      ],
      name: 'getRewardsBalance',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function',
    },
  })

  const userRewards = BigNumber.from(userRewardsRes.output)

  rewards.push({
    chain: rewardToken.chain,
    address: rewardToken.address,
    decimals: rewardToken.decimals,
    symbol: rewardToken.symbol,
    amount: userRewards,
    category: 'reward',
  })

  return rewards
}