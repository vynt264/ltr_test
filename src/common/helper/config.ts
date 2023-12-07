export class ConfigSys {
  private static DOMAIN_8B_DEV = "8B_DEV";

  private static DOMAIN_8B_PRO = "8B_PRO";

  static config() {
    if (process.env.DOMAIN === this.DOMAIN_8B_DEV) {
      return {
        department: process.env.DOMAIN || "8B",
        gameName: process.env.DOMAIN_8B_GAME || "lucky-wheel",
        multiple: process.env.MULTIPLE || 5,
        remark: process.env.REMARK || "",
        password: process.env.USER_PASSWORD || "jtmbdguF@Jcuf%5dhRMQrjj",
        condition: process.env.SCORE_MIN || 15000,
        deposit: process.env.DEPOSIT || 500,
        sign: process.env.SIGN_8B_DEV || "",
        signUserName: process.env.SIGN_USERNAME_DEV || "",
      };
    }

    if (process.env.DOMAIN === this.DOMAIN_8B_PRO) {
      return {
        department: process.env.DOMAIN || "8B",
        gameName: process.env.DOMAIN_8B_GAME || "lucky-wheel",
        multiple: process.env.MULTIPLE || 5,
        remark: process.env.REMARK || "",
        password: process.env.USER_PASSWORD || "jtmbdguF@Jcuf%5dhRMQrjj",
        condition: process.env.SCORE_MIN || 15000,
        deposit: process.env.DEPOSIT || 500,
        sign: process.env.SIGN_8B_PRO || "",
        signUserName: process.env.SIGN_USERNAME_DEV || "",
      };
    }

    return {};
  }
}
