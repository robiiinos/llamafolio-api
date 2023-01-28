import { Balance, BalancesContext, Contract } from '@lib/adapter'
import { call } from '@lib/call'
import { abi as erc20Abi } from '@lib/erc20'
import { Token } from '@lib/token'
import { BigNumber } from 'ethers'

const bone: Token = {
  chain: 'ethereum',
  symbol: 'BONE',
  decimals: 18,
  address: '0x9813037ee2218799597d83d4a5b6f3b6778218d9',
}

const abi = {
  unclaimedTokensByUser: {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'unclaimedTokensByUser',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
}

export async function getStakerBalances(ctx: BalancesContext, contract: Contract): Promise<Balance[]> {
  const underlyings = contract.underlyings![0] as Contract

  const balanceOfRes = await call({ ctx, target: contract.address, params: ctx.address, abi: erc20Abi.balanceOf })

  return [
    {
      ...contract,
      category: 'stake',
      amount: BigNumber.from(balanceOfRes.output),
      underlyings: [underlyings],
      rewards: undefined,
    },
  ]
}

export async function getLockerBalances(ctx: BalancesContext, contract: Contract): Promise<Balance[]> {
  const lockerBalancesOfRes = await call({
    ctx,
    target: contract.address,
    params: [ctx.address],
    abi: abi.unclaimedTokensByUser,
  })

  return [{ ...bone, category: 'lock', amount: BigNumber.from(lockerBalancesOfRes.output) }]
}