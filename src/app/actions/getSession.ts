import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

const getSession = cache(async () => {
  return await getServerSession(authOptions);
});

export default getSession;
