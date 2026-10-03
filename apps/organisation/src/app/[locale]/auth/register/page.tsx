import { Suspense } from "react";
import RegisterWrapper from "./RegisterWrapper";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterWrapper />
    </Suspense>
  );
}
