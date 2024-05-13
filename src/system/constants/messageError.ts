export enum ERROR {
  PHONE_EXISTED = "PHONE_EXISTED",
  EMAIL_EXISTED = "EMAIL_EXISTED",
  PHONE_NOT_FOUND = "PHONE_NOT_FOUND",
  EMAIL_NOT_FOUND = "EMAIL_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  CREATE_FAILED = "CREATE_FAILED",
  UPDATE_FAILED = "UPDATE_FAILED",
  DELETE_FAILED = "DELETE_FAILED",
  NOT_FOUND = "NOT_FOUND",
  SYSTEM_OCCURRENCE = "SYSTEM_OCCURRENCE",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  MESSAGE_DAU_CUOI_INVALID = "Không được đặt cược quá 7 số trên một lượt xổ số",
  MESSAGE_LO_2_S0_INVALID = "Không được đặt cược quá 70 số trên một lượt xổ số",
  MESSAGE_LO_3_S0_INVALID = "Không được đặt cược quá 700 số trên một lượt xổ số",
  MESSAGE_LO_4_S0_INVALID = "Không được đặt cược quá 7000 số trên một lượt xổ số",
  ACCOUNT_BALANCE_IS_INSUFFICIENT = "Số dư tài khoản không đủ",
  MESSAGE_TRO_CHOI_THU_VI_INVALID = "Bạn không thể đặt cược tài và xỉu hoặc chẵn và lẻ cùng một kỳ và cùng một khoảng thời gian",
  MESSAGE_NOT_ORDER = "Đã quá thời gian đặt cược của kỳ này",
  MESSAGE_NOT_CANCEL = "Không được hủy",
  MESSAGE_MAINTENANCE = "Hệ thống đang bảo trì",
  MESSAGE_ERROR_BALANCE = "Số tiền đặt cược quá lớn",
}
