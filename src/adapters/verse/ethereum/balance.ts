import { Balance, BalancesContext, Contract } from '@lib/adapter'
import { abi as erc20Abi } from '@lib/erc20'
import { Call, multicall } from '@lib/multicall'
import { Token } from '@lib/token'
import { isSuccess } from '@lib/type'
import { getUnderlyingBalances } from '@lib/uniswap/v2/pair'
import { BigNumber } from 'ethers'

const abi = {
  earned: {
    inputs: [{ internalType: 'address', name: '_walletAddress', type: 'address' }],
    name: 'earned',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
}

const VERSE: Token = {
  chain: 'ethereum',
  address: '0x249ca82617ec3dfb2589c4c17ab7ec9765350a18',
  symbol: 'VERSE',
  decimals: 18,
}

export async function getVerseBalances(ctx: BalancesContext, farmers: Contract[]): Promise<Balance[]> {
  const balances: Balance[] = []

  const calls: Call[] = farmers.map((farmer) => ({ target: farmer.address, params: [ctx.address] }))

  const [balancesOfsRes, earnedsRes] = await Promise.all([
    multicall({ ctx, calls, abi: erc20Abi.balanceOf }),
    multicall({ ctx, calls, abi: abi.earned }),
  ])

  for (let farmIdx = 0; farmIdx < farmers.length; farmIdx++) {
    const farmer = farmers[farmIdx]
    const underlyings = farmer.underlyings as Contract[]
    const balancesOfRes = balancesOfsRes[farmIdx]
    const earnedRes = earnedsRes[farmIdx]

    if (!isSuccess(balancesOfRes) || !isSuccess(earnedRes)) {
      continue
    }

    balances.push({
      ...farmer,
      address: farmer.lpToken,
      amount: BigNumber.from(balancesOfRes.output),
      underlyings,
      rewards: [{ ...VERSE, amount: BigNumber.from(earnedRes.output) }],
      category: 'farm',
    })
  }

  return getUnderlyingBalances(ctx, balances)
}
