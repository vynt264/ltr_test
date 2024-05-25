import { SUPPER_ROLE } from "src/system/constants/rights";

const checkRight = (
    {
        rightsNeedCheck,
        rightsOfUser,
    }: {
        rightsNeedCheck: Array<any>,
        rightsOfUser: string,
    }) => {

    if (!rightsNeedCheck || rightsNeedCheck.length === 0) return true;

    if (!rightsOfUser) return false;

    let rights: any = [];
    try {
        rights = rightsOfUser.split(',');
    } catch (err) {
        rights = [];
    }

    if (rights.length === 0) return false;

    let hasRight = false;
    for (const rOfUser of rightsNeedCheck) {
        hasRight = rights.some((r: any) => {
            return (r === rOfUser.Name || r === SUPPER_ROLE);
        });

        if (hasRight) break;
    }

    return hasRight;
}

export {
    checkRight,
};