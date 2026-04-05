import { Toaster } from "sonner";

import App from "@/App";
import { BackgroundOrbs } from "@/components/layout/background-orbs";

export function AppChrome() {
  return (
    <>
      <BackgroundOrbs />
      <App />
      <Toaster richColors position="top-right" theme="light" />
    </>
  );
}
