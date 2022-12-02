import { Balance, BaseContext, Contract } from '@lib/adapter'
import { range } from '@lib/array'
import { call } from '@lib/call'
import { Chain } from '@lib/chains'
import { multicall } from '@lib/multicall'
import { Token } from '@lib/token'
import { isSuccess } from '@lib/type'
import { BigNumber } from 'ethers'

const abi = {
  borrowBalanceOf: {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'borrowBalanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  getAssetInfo: {
    inputs: [{ internalType: 'uint8', name: 'i', type: 'uint8' }],
    name: 'getAssetInfo',
    outputs: [
      {
        components: [
          { internalType: 'uint8', name: 'offset', type: 'uint8' },
          { internalType: 'address', name: 'asset', type: 'address' },
          { internalType: 'address', name: 'priceFeed', type: 'address' },
          { internalType: 'uint64', name: 'scale', type: 'uint64' },
          {
            internalType: 'uint64',
            name: 'borrowCollateralFactor',
            type: 'uint64',
          },
          {
            internalType: 'uint64',
            name: 'liquidateCollateralFactor',
            type: 'uint64',
          },
          {
            internalType: 'uint64',
            name: 'liquidationFactor',
            type: 'uint64',
          },
          { internalType: 'uint128', name: 'supplyCap', type: 'uint128' },
        ],
        internalType: 'struct CometCore.AssetInfo',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  numAssets: {
    inputs: [],
    name: 'numAssets',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  userCollateral: {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      { internalType: 'address', name: '', type: 'address' },
    ],
    name: 'userCollateral',
    outputs: [
      { internalType: 'uint128', name: 'balance', type: 'uint128' },
      { internalType: 'uint128', name: '_reserved', type: 'uint128' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
}

interface BalanceWithExtraProps extends Balance {
  collateralFactor: string
}

const USDC: Token = {
  chain: 'ethereum',
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  symbol: 'USDC',
}

export async function getAssetsContracts(chain: Chain, contract: Contract): Promise<Contract[]> {
  const contracts: Contract[] = []

  const numberOfAssets = await call({
    chain,
    target: contract.address,
    params: [],
    abi: abi.numAssets,
  })

  const assetsInfoRes = await multicall({
    chain,
    calls: range(0, numberOfAssets.output).map((i) => ({
      target: contract.address,
      params: [i],
    })),
    abi: abi.getAssetInfo,
  })

  for (let i = 0; i < assetsInfoRes.length; i++) {
    const assetInfoRes = assetsInfoRes[i]

    if (!isSuccess(assetInfoRes)) {
      continue
    }

    contracts.push({
      chain,
      address: assetInfoRes.output.asset,
      collateralFactor: assetInfoRes.output.borrowCollateralFactor,
    })
  }

  return contracts
}

export async function getLendBorrowBalances(
  ctx: BaseContext,
  chain: Chain,
  assets: Contract[],
  contract: Contract,
): Promise<Balance[]> {
  const balances: Balance[] = []

  const [userCollateralBalancesRes, userBorrowBalancesRes] = await Promise.all([
    multicall({
      chain,
      calls: assets.map((asset) => ({
        target: contract.address,
        params: [ctx.address, asset.address],
      })),
      abi: abi.userCollateral,
    }),

    call({
      chain,
      target: contract.address,
      params: [ctx.address],
      abi: abi.borrowBalanceOf,
    }),
  ])

  const userCollateralBalances = userCollateralBalancesRes
    .filter((res) => res.success)
    .map((res) => BigNumber.from(res.output.balance))

  const userBorrowBalances = BigNumber.from(userBorrowBalancesRes.output)

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i]
    const userCollateralBalance = userCollateralBalances[i]

    const supply: BalanceWithExtraProps = {
      chain,
      decimals: asset.decimals,
      symbol: asset.symbol,
      address: asset.address,
      amount: userCollateralBalance,
      collateralFactor: asset.collateralFactor,
      category: 'lend',
    }

    balances.push(supply)
  }

  const borrow: Balance = {
    chain,
    decimals: USDC.decimals,
    symbol: USDC.symbol,
    address: USDC.address,
    amount: userBorrowBalances,
    category: 'borrow',
  }

  balances.push(borrow)

  return balances
}