export interface UserWalletFullInfo {
  username: string;
  wallet: WalletInfo;
  rate: number;
  deposit: number;
  revenue: number;
  sumRevenue: number;
  conditionDeposit: number;
  games: any;
  subWallets: any;
  notiLight: number;
  lockEarn: number;
  lockTransfer: number;
  lockPlay: number;
}

export interface WalletInfo {
  walletCode: string;
  balance: number;
  availableBalance: number;
  holdBalance: number;
  totalUsedAmount: number;
  totalBalance: number;
  isBlock: boolean;
  isDelete: boolean;
  totalAvailableBalance: number;
}
