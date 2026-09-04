import { Suspense } from "react";
import { connection } from "next/server";

import { isGoogleAuthEnabled } from "../auth";
import { LoginForm } from "./login-form";

// The Google quick sign-in toggle comes from runtime env, so this page must
// not be prerendered at build time.
export default async function Page() {
  await connection();

  return (
    <Suspense fallback={null}>
      <LoginForm googleEnabled={isGoogleAuthEnabled} />
    </Suspense>
  );
}
