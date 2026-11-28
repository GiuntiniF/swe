import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "dayjs/locale/it";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { App } from "./App";

// DateInput legge le date scritte a mano nel formato DD/MM/YYYY solo con questo plugin.
dayjs.extend(customParseFormat);

// Se la pagina è dentro un visualizzatore che imposta data-theme, segue quel tema; altrimenti quello di sistema.
const host = document.documentElement.getAttribute("data-theme");
const forced = host === "dark" || host === "light" ? host : undefined;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="auto" forceColorScheme={forced}>
      <DatesProvider settings={{ locale: "it", firstDayOfWeek: 1 }}>
        <ModalsProvider labels={{ confirm: "Conferma", cancel: "Annulla" }}>
          <Notifications position="top-right" />
          <App />
        </ModalsProvider>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);
