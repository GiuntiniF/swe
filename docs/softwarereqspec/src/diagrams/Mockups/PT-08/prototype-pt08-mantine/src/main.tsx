import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { App } from "./App";

// Se la pagina è dentro un visualizzatore che imposta data-theme, segue quel tema; altrimenti quello di sistema.
const host = document.documentElement.getAttribute("data-theme");
const forced = host === "dark" || host === "light" ? host : undefined;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="auto" forceColorScheme={forced}>
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </StrictMode>,
);
