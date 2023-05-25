import type { Balance, BalancesContext, Contract } from '@lib/adapter'
import { mapSuccessFilter } from '@lib/array'
import { abi as erc20Abi } from '@lib/erc20'
import { multicall } from '@lib/multicall'
import { isSuccess } from '@lib/type'
import { BigNumber } from 'ethers'

const abi = {
  convertToAssets: {
    inputs: [{ internalType: 'uint256', name: 'shares', type: 'uint256' }],
    name: 'convertToAssets',
    outputs: [{ internalType: 'uint256', name: 'assets', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  getUserStakes: {
    inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
    name: 'getUserStakes',
    outputs: [
      {
        components: [
          { internalType: 'uint112', name: 'amount', type: 'uint112' },
          { internalType: 'uint112', name: 'amountWithBoost', type: 'uint112' },
          { internalType: 'uint32', name: 'unbondTimestamp', type: 'uint32' },
          { internalType: 'uint112', name: 'rewardPerTokenPaid', type: 'uint112' },
          { internalType: 'uint112', name: 'rewards', type: 'uint112' },
          { internalType: 'enum ICellarStaking.Lock', name: 'lock', type: 'uint8' },
        ],
        internalType: 'struct ICellarStaking.UserStake[]',
        name: '',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
}

export async function getSommelierStakeBalances(ctx: BalancesContext, pools: Contract[]): Promise<Balance[]> {
  const userBalanceOfsRes = await multicall({
    ctx,
    calls: pools.map((pool) => ({ target: pool.address, params: [ctx.address] })),
    abi: erc20Abi.balanceOf,
  })

  const fmtBalancesRes = await multicall({
    ctx,
    calls: userBalanceOfsRes.map((balance) =>
      isSuccess(balance) ? { target: balance.input.target, params: [balance.output] } : null,
    ),
    abi: abi.convertToAssets,
  })

  const balances: Balance[] = mapSuccessFilter(fmtBalancesRes, (res, idx: number) => ({
    ...pools[idx],
    amount: BigNumber.from(res.input.params[0]),
    underlyings: [{ ...(pools[idx].underlyings?.[0] as Contract), amount: BigNumber.from(res.output) }],
    rewards: undefined,
    category: pools[idx].category!,
  }))

  return balances
}

export async function getSommelierFarmBalances(ctx: BalancesContext, farmers: Contract[]): Promise<Balance[]> {
  const userBalancesRes = await multicall({
    ctx,
    calls: farmers.map((farmer) => ({ target: farmer.address, params: [ctx.address] })),
    abi: abi.getUserStakes,
  })

  const farmersBalances = mapSuccessFilter(userBalancesRes, (response, idx: number) => {
    const farmer = farmers[idx]
    const balances = response.output.map((res: any) => ({
      ...farmer,
      amount: res.amount,
      category: 'farm',
    }))

    return balances
  }).flat()

  const fmtBalancesRes = await multicall({
    ctx,
    calls: farmersBalances.map((farmer) => ({ target: farmer.token, params: [farmer.amount] })),
    abi: abi.convertToAssets,
  })

  const fmtBalances = mapSuccessFilter(fmtBalancesRes, (res, idx) => {
    const { amount, underlyings } = farmersBalances[idx]

    return {
      ...farmersBalances[idx],
      amount: BigNumber.from(amount),
      underlyings: [{ ...underlyings?.[0], amount: BigNumber.from(res.output) }],
    }
  })

  return fmtBalances
}