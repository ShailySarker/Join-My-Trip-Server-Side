/* eslint-disable no-console */
import bcryptjs from "bcryptjs";
import { User } from "../modules/user/user.model";
import { envVars } from "../config/env";
import { IUserRole } from "../modules/user/user.interface";

export const seedDemoUsers = async () => {
  try {
    const demoAdminEmail = "admin@gmail.com";
    const demoUserEmail = "user@gmail.com";
    const demoPassword = "Test@123";

    const commonPassword = await bcryptjs.hash(
      demoPassword,
      Number(envVars.BCRYPT.BCRYPT_SALT_ROUND)
    );

    // Seed Admin
    const isAdminExist = await User.findOne({ email: demoAdminEmail });
    if (!isAdminExist) {
        await User.create({
            fullname: "Demo Admin",
            email: demoAdminEmail,
            password: commonPassword,
            role: IUserRole.ADMIN,
            isVerified: true,
            isDeleted: false,
            auths: [{ provider: "Credential", providerId: demoAdminEmail }]
        });
        console.log("Demo Admin created!");
    }

    // Seed User
    const isUserExist = await User.findOne({ email: demoUserEmail });
    if (!isUserExist) {
        await User.create({
            fullname: "Demo User",
            email: demoUserEmail,
            password: commonPassword,
            role: IUserRole.USER,
            isVerified: true,
            isDeleted: false,
            auths: [{ provider: "Credential", providerId: demoUserEmail }]
        });
        console.log("Demo User created!");
    }

  } catch (error) {
    console.log("Error seeding demo users:", error);
  }
};
