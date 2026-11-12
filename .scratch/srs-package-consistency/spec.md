# Coerenza della SRS nella descrizione dei package

Status: done

Revisione del 2026-11-10: confronto tra le sezioni Architettura, Domain
Model, Business Logic e DAO di `docs/softwarereqspec/src/part/main.tex` e il
modello `docs/softwarereqspec/src/diagrams/class/domain_model.gaphor`.

Le modifiche al `.gaphor` le applichi tu in Gaphor. Le modifiche alla SRS
vanno scritte in Italiano Tecnico Semplificato. I numeri di riga si
riferiscono a `main.tex` al 2026-11-10 e cambiano a ogni modifica.

La numerazione dei punti è quella della revisione iniziale (1–17).

## Fatto

| Punto | Modifica |
| ----- | -------- |
| 1 `ActivitySpec` nel Domain Model | Paragrafo su `ActivitySpec`, `ActivityKind`, `createActivity` e `toSpec` tolto dal Domain Model › Exercise e spostato nella Business Logic › Exercise, senza la ripetizione Builder/Visitor. |
| 2 `Exercises` / `Exercise` | Package del Domain Model e i due diagrammi rinominati in `Exercise` in Gaphor. In `main.tex` titolo, didascalia, label (`fig:exerciseDomainModel`) e percorsi (`class/Exercise.pdf`, `BusinessLogic/Exercise.pdf`). Cancellati i vecchi `class/Exercises.pdf` e `BusinessLogic/Exercises.pdf`. |
| 3 `BookingStatus` come attributo | Domain Model › Coaching: "L'attributo `status` indica lo stato dell'appuntamento. Il suo tipo è l'enumerazione `BookingStatus`, con tre valori…" |
| 4 `PasswordResetToken` | Frase aggiunta nel Domain Model › User, senza ID del caso d'uso (punto 10). |
| 5 (A) | Business Logic › Coaching: "Il service usa `AppointmentDAO`." Le dipendenze tra service restano solo in Regole comuni. |
| 6 (A) | Domain Model in ordine User, Gym, Coaching, Exercise, TrainingPlan, ValueType. Frase "secondo le dipendenze…" sostituita con "nello stesso ordine della Business Logic e del DAO". |
| 7 (A) | Accorpamento tenuto. Introduzione del DAO: "Ogni diagramma seguente mostra i DAO di uno o due sottopackage…". In "TrainingPlan ed Exercise" ora il testo descrive prima TrainingPlan. |
| 8 | Didascalia: "Package Diagram della Business Logic". |
| 8b | Decisione: niente package diagram del DAO. |
| 9 | Introduzione del Domain Model prima della figura. Nota get/set in Italiano Tecnico Semplificato, solo nel Domain Model: "I diagrammi non mostrano i metodi get e set degli attributi e delle associazioni." |
| 10 (A) | Tolti gli ID dei casi d'uso dal DAO. |
| 11 | "Il sottopackage contiene…" in tutte le sottosezioni di Domain Model e Business Logic (il Domain Model ora parla di sottopackage nell'introduzione). |
| 12 | Domain Model › Coaching: "Il sottopackage contiene gli appuntamenti tra il PT e l'atleta." |
| 13 (A) | "atleta" minuscolo nelle sezioni dei package. Maiuscolo resta solo in "Metodi per il PT e metodi per l'Atleta" (attore). |
| 14 | "associazione PT-Palestra" e "iscrizione" minuscoli nel testo. |
| 15 (A) | "Il tipo di valore" per `Address`, `Weight`, `WeightEntry`. |
| 16 | `Gym`: "rappresenta la palestra, con il nome, l'indirizzo e il telefono." Nomi delle classi al maschile: "un `TrainingPlan`", "un `WorkoutActivity`", "un `Reps`", "i `Membership`". |
| 17 | `Controllers`: aggiunto "Dipende dal package `Business Logic`." Il nome resta `Business Logic` nel testo e `BusinessLogic` in Gaphor. |
| altro | `\sloppy` spostato prima del Domain Model: con il nuovo testo una riga di Domain Model › TrainingPlan usciva dal margine. |

## Comments

- 2026-11-12: decisioni 5A 6A 7A 8b no 9 sì 10A 13A 14 sì 15A, applicate a
  `main.tex`. La SRS compila senza errori. Restano due Overfull hbox nella
  sezione "Utilizzo dell'IA" (righe ~619–638), che queste modifiche non
  toccano.
- 2026-11-12: 16 maschile, 17 lasciato così, 2 PDF vecchi cancellati.
  Tutti i punti chiusi.
