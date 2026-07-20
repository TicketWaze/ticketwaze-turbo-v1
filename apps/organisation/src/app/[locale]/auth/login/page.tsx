import { Suspense } from "react";
import LoginWrapper from "./LoginWrapper";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginWrapper />
    </Suspense>
  );
}
