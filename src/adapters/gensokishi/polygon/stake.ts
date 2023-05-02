import { Balance, BalancesContext, Contract } from '@lib/adapter'
import { call } from '@lib/call'
import { abi as erc20Abi } from '@lib/erc20'
import { Token } from '@lib/token'
import { BigNumber } from 'ethers'

const abi = {
  earned: {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'earned',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
}

const MV: Token = {
  chain: 'polygon',
  address: '0xa3c322ad15218fbfaed26ba7f616249f7705d945',
  decimals: 18,
  symbol: 'MV',
}

const ROND: Token = {
  chain: 'polygon',
  address: '0x204820b6e6feae805e376d2c6837446186e57981',
  decimals: 18,
  symbol: 'ROND',
}

export async function getGensokishiStakeBalances(ctx: BalancesContext, staker: Contract): Promise<Balance> {
  const [{ output: userBalance }, { output: earned }] = await Promise.all([
    call({ ctx, target: staker.address, params: [ctx.address], abi: erc20Abi.balanceOf }),
    call({ ctx, target: staker.address, params: [ctx.address], abi: abi.earned }),
  ])

  return {
    ...staker,
    amount: BigNumber.from(userBalance),
    underlyings: [MV],
    rewards: [{ ...ROND, amount: BigNumber.from(earned) }],
    category: 'stake',
  }
}