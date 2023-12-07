export enum StatusTicket {
  INIT = "INIT",
  ERROR = "ERROR",
  SUCCESS = "SUCCESS",
}

export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  TRANSFER = "transfer",
  REFUND = "refund",
  PAYMENT = "payment",
  POINTS_REDEMPTION = "points_redemption",
  POINTS_EARN = "points_earn",
  FEE = "fee",
  ADJUSTMENT = "adjustment",
  EXPENSE = "expense",
  INTEREST = "interest",
}

export enum TransferMethod {
  SUB_WALLET_TO_WALLET = "sub_wallet_to_wallet",
  WALLET_TO_SUB_WALLET = "wallet_to_sub_wallet",
}

export enum DepositMethod {
  REVENUE_TO_WALLET = "revenue_to_wallet",
}

export enum PaymentMethod {
  USER_MINI_GAME = "user_mini_game",
  WALLET_MINI_GAME = "wallet_mini_game",
}

export enum AdjustmentMethod {
  ADMIN_TO_PLUS = "admin_to_plus",
  ADMIN_TO_MINUS = "admin_to_minus",
}

export enum RefundMethod{
  WALLET_REFUND = "wallet_refund",
}

export enum PointsEarnMethod{
  WALLET_POINTS_EARN = "wallet_points_earn",
}