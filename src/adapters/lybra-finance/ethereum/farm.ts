import type { Balance, BalancesContext, Contract, FarmBalance } from '@lib/adapter'
import { abi as erc20Abi } from '@lib/erc20'
import { BN_ZERO, isZero } from '@lib/math'
import type { Call } from '@lib/multicall'
import { multicall } from '@lib/multicall'
import type { Token } from '@lib/token'
import { isSuccess } from '@lib/type'
import { getUnderlyingBalances } from '@lib/uniswap/v2/pair'
import { BigNumber } from 'ethers'

const abi = {
  earned: {
    inputs: [{ internalType: 'address', name: '_account', type: 'address' }],
    name: 'earned',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  get_underlying_balances: {
    stateMutability: 'view',
    type: 'function',
    name: 'get_underlying_balances',
    inputs: [{ name: '_pool', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[8]' }],
  },
}

interface getLybraFarmBalancesParams extends FarmBalance {
  provider: string
  pool?: string
  token?: string
}

const esLBR: Token = {
  chain: 'ethereum',
  address: '0x571042B7138ee957a96A6820FCe79c48fe2DA816',
  decimals: 18,
  symbol: 'esLBR',
}

export async function getLybraFarmBalances(ctx: BalancesContext, farmers: Contract[]): Promise<Balance[]> {
  const curveBalances: getLybraFarmBalancesParams[] = []
  const swapBalances: getLybraFarmBalancesParams[] = []

  const calls: Call[] = farmers.map((farmer) => ({ target: farmer.address, params: [ctx.address] }))

  const [userBalancesRes, userPendingRewardsRes] = await Promise.all([
    multicall({ ctx, calls, abi: erc20Abi.balanceOf }),
    multicall({ ctx, calls, abi: abi.earned }),
  ])

  for (let farmerIdx = 0; farmerIdx < farmers.length; farmerIdx++) {
    const farmer = farmers[farmerIdx]
    const underlyings = farmer.underlyings as Contract[]
    const userBalanceRes = userBalancesRes[farmerIdx]
    const userPendingRewardRes = userPendingRewardsRes[farmerIdx]

    if (!underlyings || !isSuccess(userBalanceRes) || !isSuccess(userPendingRewardRes)) {
      continue
    }

    const balance: getLybraFarmBalancesParams = {
      ...farmer,
      amount: BigNumber.from(userBalanceRes.output),
      underlyings,
      rewards: [{ ...esLBR, amount: BigNumber.from(userPendingRewardRes.output) }],
      provider: farmer.provider,
      category: 'farm',
    }

    if (balance.provider === 'curve') {
      curveBalances.push(balance)
    } else {
      swapBalances.push({ ...balance, address: balance.token! })
    }
  }

  const [fmtCurveBalances, fmtSwapBalances] = await Promise.all([
    getCurveUnderlying(ctx, curveBalances),
    getUnderlyingBalances(ctx, swapBalances),
  ])

  return [...fmtCurveBalances, ...fmtSwapBalances]
}

const getCurveUnderlying = async (ctx: BalancesContext, pools: getLybraFarmBalancesParams[]): Promise<Balance[]> => {
  const balances: Balance[] = []

  const CURVE_REGISTRY_ADDRESS = '0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC'

  const [underlyingsBalancesRes, totalSuppliesRes] = await Promise.all([
    multicall({
      ctx,
      calls: pools.map((pool) => ({ target: CURVE_REGISTRY_ADDRESS, params: [pool.pool!] })),
      abi: abi.get_underlying_balances,
    }),
    multicall({
      ctx,
      calls: pools.map((pool) => ({ target: pool.token! })),
      abi: erc20Abi.totalSupply,
    }),
  ])

  for (let poolIdx = 0; poolIdx < pools.length; poolIdx++) {
    const pool = pools[poolIdx]
    const { underlyings, amount } = pool
    const underlyingsBalanceRes = underlyingsBalancesRes[poolIdx]
    const totalSupplyRes = totalSuppliesRes[poolIdx]

    if (
      !underlyings ||
      !isSuccess(underlyingsBalanceRes) ||
      !isSuccess(totalSupplyRes) ||
      isZero(totalSupplyRes.output)
    ) {
      continue
    }

    underlyings.forEach((underlying, underlyingIdx) => {
      const underlyingBalance = underlyingsBalanceRes.output[underlyingIdx]
      ;(underlying as Balance).amount =
        BigNumber.from(underlyingBalance).mul(amount).div(totalSupplyRes.output) || BN_ZERO
    })

    balances.push(pool)
  }

  return balances
}