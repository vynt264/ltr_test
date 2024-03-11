import { API } from "../../components/api.third/api.entity";
import { AppDataSource } from "../../system/config.system/data.source";
import { User } from "../../components/user/user.entity";
import { Permission } from "../../components/permission/permission.entity";
import { UserRoles } from "../../components/user/enums/user.enum";

AppDataSource.initialize()
  .then(async () => {
    const apis = [
      {
        api: "https://api.888b01.com/member/r/userCe",
        action: "LOGIN",
        department: "8B",
      },
      {
        api: "https://888b01.com/member/r/re",
        action: "UPDATE",
        department: "8B",
      },
    ];

    // const games = [
    //   { name: "Nổ Hũ", type: 1 },
    //   { name: "Game Việt", type: 2 },
    //   { name: "Bắn cá", type: 3 },
    //   { name: "Casino", type: 4 },
    //   { name: "Thể thao", type: 5 },
    // ];

    const input: any = [
      [3888.0, 0.0],
      [1888.0, 0.005],
      [88.0, 0.035],
      [68.0, 0.07],
      [38.0, 0.1],
      [18.0, 0.2],
      [0.0, 0.25],
      [8.0, 0.34],
    ];

    const roles = [UserRoles.SUPPER, UserRoles.MEMBER];
    roles.map((role) => {
      const permission = new Permission();
      permission.role = role;
      AppDataSource.manager.save(permission);
    });
    const user = new User();
    // user.email = "super@super.com";
    user.username = "super9999";
    user.name = "super";
    user.password = "8y9Z$%XblG%Dm2H6%ooR";
    user.role = UserRoles.SUPPER;
    await AppDataSource.manager.save(user);

    for (let index = 0; index < 2; index++) {
      const api = new API();
      api.api = apis[index].api;
      api.action = apis[index].action;
      api.department = apis[index].department;
      await AppDataSource.manager.save(api);
    }

    for (let index = 0; index < input.length; index++) {
      // TODO comment
      // const award = new Award();
      // award.proportion = input[index][1];
      // award.name = `${input[index][0]}`;
      // await AppDataSource.manager.save(award);
    }

    process.exit();
  })
  .catch((error) => console.log(error));
