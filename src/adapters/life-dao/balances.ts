import { Chain } from "@defillama/sdk/build/general";
import { Contract, Balance } from "@lib/adapter";
import { BaseContext } from "@lib/adapter";
import { abi } from "@lib/erc20";
import { call } from "@defillama/sdk/build/abi";
import { BigNumber } from "ethers/lib/ethers";

export async function getStakeBalances(
  ctx: BaseContext,
  chain: Chain,
  contract?: Contract
) {
  if (!contract || !contract.underlyings?.[0]) {
    return [];
  }

  const balances: Balance[] = [];

  const balanceOfRes = await call({
    chain,
    target: contract.address,
    params: [ctx.address],
    abi: abi.balanceOf,
  });

  const amount = BigNumber.from(balanceOfRes.output);

  const balance: Balance = {
    chain,
    address: contract.address,
    decimals: contract.decimals,
    symbol: contract.symbol,
    amount,
    underlyings: [{ ...contract.underlyings?.[0], amount }],
    category: "stake",
  };
  balances.push(balance);

  return balances;
}