import passport from "passport";
import { User } from "../modules/user/user.model";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";
import { envVars } from "./env";
import { IProvider, IUserRole } from "../modules/user/user.interface";

// passport-google-oauth20
passport.use(
  new GoogleStrategy(
    {
      clientID: envVars.GOOGLE.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE.GOOGLE_CLIENT_SECRET,
      callbackURL: envVars.GOOGLE.GOOGLE_CALLBACK_URL,
      proxy: true,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      try {
        const email = profile.emails?.[0].value;

        if (!email) {
          return done(null, false, { message: "No email found" });
        }

        let isUserExist = await User.findOne({ email });
        if (isUserExist && !isUserExist.isVerified) {
          // throw new AppError(status.BAD_REQUEST, "User is not verified");
          return done(null, false, { message: "User is not verified" });
        }

        if (isUserExist && isUserExist.isDeleted) {
          // throw new AppError(status.BAD_REQUEST, "User is deleted");
          // return done(`User is deleted`)
          return done(null, false, { message: "User is deleted" });
        }

        if (!isUserExist) {
          isUserExist = await User.create({
            email,
            fullname: profile.displayName,
            profilePhoto: profile.photos?.[0].value,
            role: IUserRole.USER,
            isVerified: true,
            auths: [
              {
                provider: IProvider.GOOGLE,
                providerId: profile.id,
              },
            ],
          });
        }

        return done(null, isUserExist);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log("google Strategy Error", error);
        return done(error);
      }
    },
  ),
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport.serializeUser((user: any, done: (err: any, id?: unknown) => void) => {
  done(null, user._id);
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
passport.deserializeUser(async (id: string, done: any) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    done(error);
  }
});
