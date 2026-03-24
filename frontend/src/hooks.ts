import { useSuiClientQuery, useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, GAME_CONFIG_ID, MODULE_NAME, RANDOM_ID } from './constants';

export function useLootBoxPrice() {
  const { data, isLoading } = useSuiClientQuery('getObject', {
    id: GAME_CONFIG_ID,
    options: { showContent: true },
  });

  // @ts-ignore
  const price = data?.data?.content?.fields?.loot_box_price;
  return { price, isLoading };
}

export function useUserNFTs(address?: string) {
  const { data, isLoading, refetch } = useSuiClientQuery('getOwnedObjects', {
    owner: address || '',
    filter: { StructType: `${PACKAGE_ID}::${MODULE_NAME}::GameItem` },
    options: { showContent: true },
  });

  const nfts = data?.data?.map(obj => {
    // @ts-ignore
    const fields = obj.data?.content?.fields;
    return {
      id: obj.data?.objectId,
      name: fields?.name,
      rarity: fields?.rarity,
      power: fields?.power,
    };
  }) || [];

  return { nfts, isLoading, refetch };
}

export function usePurchaseLootBox() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  
  const purchase = async (price: number) => {
    if (!account) return;
    
    const tx = new Transaction();
    const [coin] = tx.splitCoins(tx.gas, [price]);
    
    const box = tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::purchase_loot_box`,
      arguments: [tx.object(GAME_CONFIG_ID), coin],
      typeArguments: ['0x2::sui::SUI']
    });

    tx.transferObjects([box], tx.pure.address(account.address));

    return signAndExecute({ transaction: tx });
  };

  return { purchase };
}

export function useOpenLootBox() {
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const account = useCurrentAccount();
  
  const open = async (lootBoxId: string) => {
    if (!account) return;
    
    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::open_loot_box`,
      arguments: [tx.object(GAME_CONFIG_ID), tx.object(lootBoxId), tx.object(RANDOM_ID)],
      typeArguments: ['0x2::sui::SUI']
    });

    return signAndExecute({ transaction: tx });
  };

  return { open };
}
