import { Balance, Contract } from '@lib/adapter'
import { BaseContext } from '@lib/adapter'
import { call } from '@lib/call'
import { Chain } from '@lib/chains'
import { abi } from '@lib/erc20'
import { BigNumber } from 'ethers/lib/ethers'

const LF: Contract = {
  name: 'Life',
  chain: 'avax',
  address: '0x5684a087C739A2e845F4AaAaBf4FBd261edc2bE8',
  symbol: 'LF',
  decimals: 9,
}

export async function getStakeBalances(ctx: BaseContext, chain: Chain, contract: Contract): Promise<Balance[]> {
  const balances: Balance[] = []

  const balanceOfRes = await call({
    chain,
    target: contract.address,
    params: [ctx.address],
    abi: abi.balanceOf,
  })

  const amount = BigNumber.from(balanceOfRes.output)

  balances.push({
    chain,
    address: contract.address,
    decimals: contract.decimals,
    symbol: contract.symbol,
    amount,
    underlyings: [{ ...LF, amount }],
    category: 'stake',
  })

  return balances
}