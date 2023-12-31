import { Elysia, t } from "elysia";
import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";

import { addUser, getUser } from "../models/User";
const userRoute = new Elysia();

userRoute
  .use(
    jwt({
      name: "jwt",
      secret: String(process.env.JWT_SECRETS),
    })
  )
  .use(cookie())

  /**
   * Register
   */
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        let userData = body;
        userData.password = await Bun.password.hash(userData.password, {
          algorithm: "bcrypt",
          cost: 4,
        });
        addUser(userData);

        set.status = 201;
        return { message: "User created" };
      } catch (error) {
        console.log(error);
        set.status = 409;
        return { message: "error", error };
      }
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )

  /**
   * Login
   */
  .post(
    "/login",
    async ({ jwt, cookie, setCookie, body }) => {
      try {
        let userData = body;
        const response = await getUser(userData);

        if (!response.loggedIn) {
          return response;
        }

        setCookie(
          "token",
          await jwt.sign({
            email: userData.email,
          }),
          {
            httpOnly: true,
            maxAge: 7 * 86400,
          }
        );

        return {
          message: "Login successful",
          token: cookie.token,
        };
      } catch (error) {}
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  );


export default userRoute;