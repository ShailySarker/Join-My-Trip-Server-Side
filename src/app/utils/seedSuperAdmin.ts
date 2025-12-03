/* eslint-disable no-console */
import bcryptjs from "bcryptjs";
import { User } from "../modules/user/user.model";
import { envVars } from "../config/env";
import { IUser, IUserRole } from "../modules/user/user.interface";

export const seedSuperAdmin = async () => {
  try {
    const isSuperAdminExist = await User.findOne({
      email: envVars.SUPER_ADMIN.SUPER_ADMIN_EMAIL,
    });

    if (isSuperAdminExist) {
      console.log("Super Admin Already Exists!");
      return;
    }

    // console.log("Trying to create Super Admin...");
    const hashedPassword = await bcryptjs.hash(
      envVars.SUPER_ADMIN.SUPER_ADMIN_PASSWORD,
      Number(envVars.BCRYPT.BCRYPT_SALT_ROUND)
    );

    const payload: IUser = {
      fullname: "Super Admin",
      role: IUserRole.SUPER_ADMIN,
      email: envVars.SUPER_ADMIN.SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      isVerified: true,
      isDeleted: false,
    };
    // console.log("Payload: ", payload);

    const superAdmin = await User.create(payload);

    console.log("Super Admin created successfully", superAdmin);
  } catch (error) {
    console.log(error);
  }
};
