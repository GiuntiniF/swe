# Revisione di TrainingPlan ed Exercises: piano

Status: ready

Revisione del 2026-11-03: confronto tra i casi d'uso della SRS (PT-03, PT-04, PT-05,
PT-08, PT-09, PT-10, PT-11, PT-16, A-03) e il `.gaphor`
(`docs/softwarereqspec/src/diagrams/class/domain_model.gaphor`).

Le modifiche al `.gaphor` le applichi tu in Gaphor. Le modifiche alla SRS vanno
scritte in Italiano Tecnico Semplificato.

In questo file, "accanto alla classe X" indica il numero scritto all'estremità
dell'associazione che tocca X.

## Decisioni

| Punto                         | Decisione                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 Ripristino del peso       | `AssignedExercise` tiene i valori base e, a parte, gli override opzionali. Il valore effettivo è l'override, se c'è, altrimenti il base. "Ripristina" cancella gli override. |
| 1.1 Salvataggio di PT-09      | `customize` salva un override solo per i campi diversi dal base. `/isCustomized` è vero se c'è almeno un override.                                                           |
| 2 Molteplicità                | Composizioni a `0..*`, `0..7`, `0..*`. Nuovo `TrainingPlan.isConfigured()`: almeno un blocco, ogni blocco con almeno una sessione, ogni sessione con almeno un'attività.     |
| 2 Lista di PT-05              | Le schede non configurate sono mostrate ma non assegnabili. `addAssignment` le rifiuta comunque.                                                                             |
| 2 Massimo 7 sessioni          | Con 7 sessioni il pulsante "Aggiungi Sessione" non c'è. `addTrainingSession` rifiuta comunque l'ottava (`MonthlyBlock.canAddSession()`).                                     |
| 1.5 Durata                    | `TrainingPlan.getTotalWeeks()` e `TrainingPlan.getEndDate(startDate)`. `PlanAssignment./endDate` usa `getEndDate`.                                                           |
| 1.5 Glossario                 | Il blocco mensile dura un numero di settimane scelto dal PT, di norma quattro.                                                                                               |
| 1.6 Peso in drop              | La vista si costruisce dall'alto con un visitor. Nuovi `DropSetDecorator.getDropWeight(weight)` e `Weight.multiply(factor)`.                                                 |
| 1.6 Discese                   | Una sola discesa per drop-set. Per più discese si annidano più `DropSetDecorator`.                                                                                           |
| 1.6 Vista della settimana     | Visitor e DTO nella Business Logic. `getAssignmentWeek` restituisce le sessioni già pronte per la vista.                                                                     |
| 3.1 Serie                     | Una `Reps` per serie: `reps: Reps [1..*]` nel builder e nel costruttore di `Exercise`.                                                                                       |
| 3.2 ActivitySpec              | Albero con `kind`. Un decoratore ha un figlio, una superserie ne ha 2 o più.                                                                                                 |
| 3.3 Recupero della superserie | `Exercise.restTime` è il recupero dopo quell'esercizio. `Superset.getRestTime()` restituisce quello dell'ultimo esercizio.                                                   |
| 3.4 Rest-pause                | `RestPauseDecorator` ridefinisce solo `getVolumeText()`.                                                                                                                     |
| 3.5 Catalogo                  | Gli `ExerciseType` sono predefiniti (seed) e in sola lettura.                                                                                                                |
| 4.3 Ordine                    | Nota `{ordered}` sulle composizioni ordinate. Si toglie `MonthlyBlock.order`.                                                                                                |
| 4.3 Giorno                    | La sessione non ha un giorno fisso, solo una posizione nel blocco.                                                                                                           |
| 1.3 / 1.4 Dipendenze          | `TrainingPlanService` usa `PlanAssignmentDAO`. `PlanAssignmentService` usa `TrainingPlanService` e `UserService`.                                                            |
| 1.7 / 1.8 Accesso             | Controllo nei service: `ptId` o `athleteId` nelle firme. Il PT opera su un'assegnazione se la scheda è sua e l'atleta ha con lui un `PTAssignment` attivo.                   |
| 1.9 PT-09                     | Sono personalizzabili le assegnazioni `Confirmed` in corso o programmate, nella settimana corrente e in quelle successive.                                                   |
| 1.11 Spostamento              | `moveAssignment` è ammessa solo sulle bozze.                                                                                                                                 |
| 4.2 Data odierna              | `Week.isCurrent(today)` e `Week.isEditable(today)`.                                                                                                                          |
| 1.10 Notifiche                | Rinviate a un `NotificationService` comune a tutti i package. L'invio può anche essere solo simulato.                                                                        |
| Sovrapposizione               | `PlanAssignment.overlaps(start, end)` nel dominio. Si toglie `Athlete.isFreeIn`, che creava la dipendenza `User ..> TrainingPlan`.                                           |
| 4 Carico totale               | `AssignedExercise.getTotalLoad(): Weight`.                                                                                                                                   |
| 5 main.tex                    | L'elenco dei metodi si riallinea alla fine, dopo le modifiche in Gaphor.                                                                                                     |

## Piano

L'ordine conta: prima il Domain Model, poi la Business Logic, che lo usa, e per
ultima la SRS, che descrive entrambi.

### A. Domain Model, package TrainingPlan

- [x] **A1. `AssignedExercise`**
  - Attributi: tieni `weight: Weight [0..1]` (carico di PT-05). Togli `restTime` e
    `isCustomized`. Aggiungi `customWeight: Weight [0..1]`,
    `customRestTime: Duration [0..1]` e `/isCustomized: bool` (derivato).
  - Associazione `AssignedExercise ◆— Reps`: nome del ruolo `customReps`. Il numero
    accanto alla classe `Reps` passa da `1..*` a `0..*`.
  - Operazioni:
    - `getEffectiveWeight(): Weight [0..1]` (vuoto solo in bozza)
    - `getEffectiveReps(): Reps [1..*]`
    - `getEffectiveRestTime(): Duration`
    - `getSets(): int` (numero delle `Reps` effettive)
    - `getTotalLoad(): Weight` (al posto di `: int`)
    - `customize(in weight: Weight, in reps: Reps [1..*], in restTime: Duration)`
    - `resetCustomization()`
  - Nota: "Il valore effettivo è l'override, se presente. Altrimenti è il base:
    `weight` per il peso, `Exercise.reps` ed `Exercise.restTime` per serie e
    recupero. `customize` salva un override solo per i valori diversi dal base.
    `/isCustomized` è vero se almeno un override è presente.
    `resetCustomization` cancella tutti gli override."
  - Nel codice, `Reps` deve avere l'uguaglianza per valore: `customize` confronta
    le `Reps`.
- [ ] **A2. `TrainingPlan`**: aggiungi `getTotalWeeks(): int`,
  `getEndDate(in startDate: LocalDate): LocalDate` e `isConfigured(): bool`.
  - Nota su `isConfigured`: "Vera se la scheda ha almeno un blocco, ogni blocco ha
    almeno una sessione e ogni sessione ha almeno un'attività."
- [x] **A3. `PlanAssignment`**
  - Aggiungi `overlaps(in startDate: LocalDate, in endDate: LocalDate): bool`.
  - Nota: "`overlaps` è vera solo se l'assegnazione è `Confirmed` e il suo
    intervallo interseca quello dato, estremi compresi. Due intervalli contigui
    non si sovrappongono. `canMoveTo` e `moveTo` sono ammesse solo in `Draft`."
- [x] **A4. `MonthlyBlock`**: togli `order`. Aggiungi `canAddSession(): bool`
  (meno di 7 sessioni).
- [x] **A5. Molteplicità**
  - `TrainingPlan ◆— MonthlyBlock`: accanto a `MonthlyBlock`, da `1..*` a `0..*`.
  - `MonthlyBlock ◆— TrainingSession`: accanto a `TrainingSession`, da `1..7` a `0..7`.
  - `TrainingSession ◆— WorkoutActivity`: accanto a `WorkoutActivity`, da `1..*` a `0..*`.
- [x] **A6. `Week`**
  - `isCurrent(in today: LocalDate): bool` e `isEditable(in today: LocalDate): bool`.
  - Aggiungi `getAssignedExercise(in exercise: Exercise): AssignedExercise [0..1]`.
  - Correggi la nota della formula:
    `startDate = planAssignment.startDate + (weekNumber - 1) * 7`.
  - Nota su `isEditable`: "Vera se la `PlanAssignment` è `Confirmed` e
    `endDate >= today`."
  - Nota "In una AssignedWeek c'è al più…": sostituisci `AssignedWeek` con
    `Week` e agganciala a `Week` (oggi la linea è staccata).
- [x] **A7. Ordine**: una nota `{ordered}` agganciata con una Comment line
  (`Shift+K`) a ciascuna di queste associazioni:
  - `TrainingPlan ◆— MonthlyBlock`
  - `MonthlyBlock ◆— TrainingSession`
  - `TrainingSession ◆— WorkoutActivity`
  - `Superset ◆— WorkoutActivity`
  - `Exercise ◆— Reps`
  - `AssignedExercise ◆— customReps`

### B. Domain Model, package User, Exercises e ValueType

- [x] **B1. `Athlete`**: togli `isFreeIn`. L'associazione `Athlete — PlanAssignment`
  è navigabile solo da `PlanAssignment` verso `Athlete`.
- [x] **B2. `WorkoutActivityBuilder.exercise`**: `reps: Reps [1..*]`.
- [x] **B3. Costruttore di `Exercise`**:
  `Exercise(in exerciseType: ExerciseType, in reps: Reps [1..*], in restTime: Duration, in exerciseNotes: string)`.
  Correggi anche i nomi dei costruttori con `()()` e il refuso `WorkoutACtivityDecorator`.
- [x] **B4. `Superset`**: nota "Il `restTime` di un `Exercise` è il recupero dopo
  quell'esercizio. Dentro una superserie è il passaggio all'esercizio successivo.
  Per l'ultimo esercizio è il recupero tra un giro e l'altro.
  `Superset.getRestTime()` restituisce quello dell'ultima attività."
- [x] **B5. `RestPauseDecorator`**: aggiungi `getVolumeText(): string`.
- [x] **B6. `DropSetDecorator`**: aggiungi `getDropWeight(in weight: Weight): Weight`.
  Nota: "Un drop-set ha una sola discesa. Per più discese si annidano più
  `DropSetDecorator`."
- [x] **B7. `WorkoutActivity`**: svuota il campo `note` (contiene ancora la prima
  versione del testo `{xor}`). Facoltativo: riporta le note `{xor}` anche nei
  diagrammi `TrainingPlan` e `_Domain Model`, come chiedeva `.scratch/domain-model-fix/fix.md`.
- [x] **B8. `Weight`**: aggiungi `multiply(in factor: float): Weight`.

### C. Business Logic

- [ ] **C1. `ActivitySpec`** (package `BusinessLogic/Exercise`)
  - Nuova enumerazione `ActivityKind` con i valori `Exercise`, `Superset`,
    `DropSet` e `RestPause`.
  - Aggiungi `kind: ActivityKind`.
  - Nota: "I campi valorizzati dipendono da `kind`. `Exercise`: `exerciseTypeId`,
    `reps`, `restTime`, `notes`. `DropSet`: `weightMultiplier` e un figlio.
    `RestPause`: `restPauseTime` e un figlio. `Superset`: due o più figli."
  - `ActivitySpecVisitor` costruisce l'albero; `createActivity` lo ricostruisce
    con il builder.
- [ ] **C2. `TrainingPlanService`**
  - Associazione verso `PlanAssignmentDAO`. `isStructureEditable` la usa (la nota
    esistente lo dice già).
  - `ptId` in tutti i metodi che ricevono `planId`, per esempio
    `getPlan(in planId, in ptId)`, `deletePlan(in planId, in ptId)`,
    `duplicatePlan(in planId, in ptId, in name)`, `addMonthlyBlock(in planId, in ptId, in weeksCount)`
    e così per blocchi, sessioni e attività.
  - `addTrainingSession` rifiuta l'ottava sessione (`MonthlyBlock.canAddSession()`).
  - Nota: "Ogni metodo controlla che la scheda appartenga al PT `ptId`. Il nome di
    una scheda è unico tra le schede dello stesso PT (PT-03 5a, PT-10 7a, PT-16 6a)."
- [ ] **C3. `PlanAssignmentService`**
  - Dipendenze verso `TrainingPlanService` e `UserService`.
  - Metodi del PT, con `ptId`:
    - `addAssignment(in athleteId, in planId, in ptId, in startDate)`
    - `getAssignment(in assignmentId, in ptId)`
    - `getAssignmentWeek(in assignmentId, in weekId, in ptId): AssignedSessionView [0..*]`
    - `saveDraft`, `discardDraft`, `confirmAssignment`, `moveAssignment`,
      `customizeAssignedExercise`, `resetAssignedExercise`: aggiungi `ptId`
  - Metodi dell'atleta:
    - `getAssignmentForAthlete(in assignmentId, in athleteId): PlanAssignment`
    - `getAssignmentWeekForAthlete(in assignmentId, in weekId, in athleteId): AssignedSessionView [0..*]`
  - `findOverlappingAssignment` resta e usa `PlanAssignment.overlaps`.
  - Aggiungi alla nota:
    - "Il PT opera su un'assegnazione se la scheda è sua e l'atleta ha con lui un
      `PTAssignment` attivo. L'atleta vede solo le proprie assegnazioni `Confirmed`."
    - "`addAssignment` rifiuta le schede con `isConfigured()` falso."
    - "`moveAssignment` è ammessa solo in `Draft`."
    - "`customizeAssignedExercise` e `resetAssignedExercise` sono ammesse solo se
      `Week.isEditable(today)`."
    - "`confirmAssignment` e `customizeAssignedExercise` notificano l'atleta con il
      `NotificationService` (da definire; può essere simulato)."
- [ ] **C4. Vista della settimana** (package `BusinessLogic/TrainingPlan`)
  - `AssignedActivityVisitor implements WorkoutActivityVisitor`. Riceve la `Week` e
    percorre l'albero di ogni `TrainingSession`.
  - DTO `AssignedSessionView`: `sessionId: UUID`,
    `activities: AssignedActivityView [0..*]`.
  - DTO `AssignedActivityView`:
    - `kind: ActivityKind`
    - `assignedExerciseId: UUID [0..1]`
    - `exerciseTypeName: string [0..1]`
    - `reps: Reps [0..*]`
    - `restTime: Duration [0..1]`
    - `weight: Weight [0..1]`
    - `dropWeight: Weight [0..1]`
    - `weightMultiplier: float [0..1]`
    - `restPauseTime: Duration [0..1]`
    - `isCustomized: bool`
    - `children: AssignedActivityView [0..*]`
  - `assignedExerciseId` serve a PT-09 (passo 6) per aprire il form di un esercizio.

### D. SRS (Italiano Tecnico Semplificato)

- [ ] **D1. Glossario, "Blocco mensile"**: "Dura un numero di settimane scelto dal
  PT, di norma quattro."
- [ ] **D2. PT-04**
  - Nuovo flusso alternativo: "Il blocco ha già 7 sessioni: il sistema non mostra
    il pulsante 'Aggiungi Sessione'."
  - Nota 3: togli l'esempio dei giorni, oppure scrivi che è solo indicativo.
  - Nuova nota: il catalogo degli esercizi è predefinito.
- [ ] **D3. PT-05**
  - Passo 3: il sistema segnala le schede non configurate.
  - Nuovo flusso alternativo: "Scheda non configurata: il sistema non permette di
    sceglierla."
  - Nota 2: il drop-set ha una sola discesa.
- [ ] **D4. PT-09**
  - Precondizione: "in corso o programmata".
  - Nota 1: i valori base (carico di PT-05, serie e recupero della scheda) e le
    personalizzazioni sono distinti.
  - 7a: il ripristino riporta anche il peso al carico inserito in PT-05.
- [ ] **D5. A-03 Nota 1**: allineala alla Nota 1 di PT-09.
- [ ] **D6. main.tex**: riallinea l'elenco dei metodi (sezione "Utilizzo dell'IA")
  e la descrizione del package Exercises (`ActivitySpec` con `kind`) dopo le
  modifiche in Gaphor.

### Rinviato

- `NotificationService` comune (PT-05, PT-09 e gli altri package; vedi
  `business-logic-user-gym-coaching.md`, punto aperto 1).
