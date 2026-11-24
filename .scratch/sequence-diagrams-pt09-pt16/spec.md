# Sequence Diagram — PT-09 (Personalizzazione) e PT-16 (Duplicazione)

Status: ready-for-human

Specifica testuale dei sequence diagram di PT-09 e PT-16 da disegnare in
Gaphor. Seguono le **convenzioni comuni** di
`.scratch/sequence-diagrams/spec.md` (lifeline, `ptId`, ritorni, `«create»`,
`alt` con `errore: …` e un solo `mostra esito`, accessor impliciti, note
"non trovato"). Qui ci sono solo le differenze e i diagrammi nuovi.

## Diagrammi

| #   | Nome in Gaphor            | File esportato                                 | Copre                                               |
| --- | ------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| D5  | `PT-09 Personalizzazione` | `Sequence_Diagrams/PT_09_Personalizzazione.pdf` | passi 9–10 (salvataggio), 7a in nota                |
| D6  | `PT-16 Duplicazione`      | `Sequence_Diagrams/PT_16_Duplicazione.pdf`      | passi 5–8 e flusso 6a                               |
| D7  | `PT-16 Copia Scheda`      | `Sequence_Diagrams/PT_16_Copia_Scheda.pdf`      | copia profonda della scheda, richiamata con `ref` da D6 |

Posizione nel modello: sottopackage `PT-09` e `PT-16` di `Sequence Diagrams`,
come `PT-05`. I nomi dei file sono verificati con `escape_filename`.

Fuori ambito:

- PT-09 passi 1–7 (lettura dell'assegnazione e della Week): sono
  `getAssignment` e `getAssignmentWeek`, che riusano `buildSessionViews`
  come D3. Il flusso 4a (scheda terminata) è una lettura di
  `getPeriodState`.
- PT-09 passo 11 e PT-05/PT-16: l'email è fuori dal modello (Gestione
  Notifiche, vedi TODO).
- PT-16 passo 4 (nome precompilato con "(copia)"): lo fa la UI.

## Modifiche al Domain Model (da fare in Gaphor)

### Per PT-09 (D5)

| Classe           | Modifica                                                                  | Note                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `PlanAssignment` | aggiungere `getWeekOf(assignedExercise: AssignedExercise): Week[0..1]`    | la Week che contiene l'`AssignedExercise`. Da `AssignedExercise` non si naviga a `Week`, e la Business Logic non deve scorrere la composizione `PlanAssignment` → `Week` → `AssignedExercise` (stesso criterio di `getAssignedExercises` in D4) |
| `Week`           | `isEditable()` diventa `isEditable(today: LocalDate): bool`               | la nota dice "Confirmed e endDate >= today": serve `today`, come in `isCurrent(today)` e `PlanAssignment.isActive(today)` |

### Per PT-16 (D6, D7) — pattern Prototype

Ogni classe della scheda copia sé stessa e chiede la copia alle sue parti.
Le copie si costruiscono dal basso: prima i figli, poi il padre con i
figli copiati. È lo stesso schema dei costruttori che il modello ha già
(`Superset(activities)`, `DropSetDecorator(activity, weightMultiplier)`).

| Classe                      | Metodo                                  | Note                                                                         |
| --------------------------- | --------------------------------------- | ---------------------------------------------------------------------------- |
| `TrainingPlan`              | `copy(name: string): TrainingPlan`      | stesso PT e stessa `description`, nome nuovo                                 |
| `MonthlyBlock`              | `copy(): MonthlyBlock`                  | stesso `weeksCount`                                                          |
| `TrainingSession`           | `copy(): TrainingSession`               |                                                                              |
| `WorkoutActivity`           | `copy(): WorkoutActivity` {abstract}    |                                                                              |
| `Exercise`                  | `copy(): WorkoutActivity`               | stesso `ExerciseType` (è del catalogo e non si copia)                        |
| `Superset`                  | `copy(): WorkoutActivity`               | `copy()` su ogni figlio, poi `Superset(childCopies)`                         |
| `DropSetDecorator`          | `copy(): WorkoutActivity`               | `copy()` sul figlio, poi `DropSetDecorator(childCopy, weightMultiplier)`     |
| `RestPauseDecorator`        | `copy(): WorkoutActivity`               | `copy()` sul figlio, poi `RestPauseDecorator(childCopy, restTimeBetweenReps)` |

`WorkoutActivityDecorator` non implementa `copy()`: i costruttori delle
sottoclassi hanno parametri diversi.

Costruttori che D7 usa. Vanno aggiunti se vuoi che compaiano nel diagramma
delle classi:

- `TrainingPlan(pt: PT, name: string, description: string, blocks: MonthlyBlock[0..*])`.
  `addPlan` (PT-03) lo chiama con `blocks` vuoto;
- `MonthlyBlock(weeksCount: int, sessions: TrainingSession[0..7])`.
  `addMonthlyBlock` (PT-04) lo chiama con `sessions` vuoto (vedi
  osservazione 3);
- `TrainingSession(activities: WorkoutActivity[0..*])`.

Perché nel Domain Model e non con `ExerciseService.toSpec` +
`createActivity`: la copia usa solo i dati dell'oggetto e delle sue parti,
quindi per il criterio di `.scratch/sequence-diagrams/spec.md` sta nel
Domain Model. Con `toSpec`/`createActivity` il service dovrebbe scorrere
`TrainingPlan` → `MonthlyBlock` → `TrainingSession` da solo.

## Modifiche alla Business Logic

Nessuna. `customizeAssignedExercise`, `resetAssignedExercise`,
`duplicatePlan`, `PlanAssignmentDAO.findByAssignedExercise` e
`TrainingPlanDAO.findByPT` ci sono già.

I controller non sono nel modello (il package `Controllers` è vuoto), come in
D1–D4. D6 usa `:TrainingPlanController`.

## Osservazioni sul modello emerse durante la specifica

1. **`Week` non naviga verso `PlanAssignment`** (nel diagramma TrainingPlan
   la freccia va solo da `PlanAssignment` a `Week`). Però `Week` ne ha
   bisogno in tre punti:
   - `/startDate` e `/endDate` usano `planAssignment.startDate` (nota sul
     diagramma);
   - `getMonthlyBlock()` somma i `weeksCount` dei blocchi della scheda (lo
     usa già D3);
   - `isEditable(today)` controlla `status = Confirmed`.

   Proposta: rendere navigabile l'estremo `Week` → `PlanAssignment`
   (molteplicità `1`). Una parte che conosce il suo tutto è normale in una
   composizione.
2. `Week.isEditable()` senza `today`: vedi la tabella di PT-09.
3. `MonthlyBlock` → `TrainingSession` ha molteplicità `1..7`, ma
   `addMonthlyBlock` crea un blocco senza sessioni, e la nota di
   `isConfigured` ("ogni blocco ha almeno una sessione") ammette blocchi
   vuoti. La molteplicità corretta è `0..7`.

## D5 — PT-09 Personalizzazione

Passi 9–10: il PT salva i valori modificati di un esercizio.

**Lifeline:** `PT`, `:PlanAssignmentController`, `:PlanAssignmentService`,
`:UserService`, `:PlanAssignmentDAO`, `assignment:PlanAssignment`,
`week:Week`, `assignedExercise:AssignedExercise`, `exercise:Exercise`.

1. `PT` → `:PlanAssignmentController`:
   `customizeAssignedExercise(assignedExerciseId, weight, reps, restTime)`
2. `:PlanAssignmentController` → `:PlanAssignmentService`:
   `customizeAssignedExercise(assignedExerciseId, ptId, weight, reps, restTime)`
   1. `:PlanAssignmentService` → `:PlanAssignmentDAO`:
      `findByAssignedExercise(assignedExerciseId)`

   2. ritorno: `assignment`

   3. **`ref Controllo PT dell'atleta(assignment.getAthlete().id, ptId)`**

   4. `:PlanAssignmentService` → `assignment`: `getAssignedExercises()`

   5. ritorno: `assignedExercises`

   6. `:PlanAssignmentService` → `assignment`: `getWeekOf(assignedExercise)`
      (`assignedExercise` è l'`ae` in `assignedExercises` con
      `ae.id = assignedExerciseId`)

   7. ritorno: `week`

   8. `:PlanAssignmentService` → `week`: `isEditable(today)`

   9. ritorno: `editable`

   10. **`alt [editable = false]`**

       - ritorno: `errore: settimana non modificabile`

       **`[else]`**

       1. `:PlanAssignmentService` → `assignedExercise`:
          `customize(weight, reps, restTime)`
          1. `assignedExercise` → `exercise`: `getReps()`
          2. ritorno: `baseReps`
          3. `assignedExercise` → `exercise`: `getRestTime()`
          4. ritorno: `baseRestTime`
       2. `:PlanAssignmentService` → `:PlanAssignmentDAO`: `update(assignment)`
3. `:PlanAssignmentController` → `PT` (ritorno): `mostra esito`: la
   conferma e il ritorno al passo 5 con i valori aggiornati, oppure il
   messaggio di errore

**Note sul diagramma:**

- "ptId = PT autenticato. today è la data odierna del sistema."
- "Se findByAssignedExercise non trova l'assegnazione, il service
  restituisce errore: non trovato. Se il controllo del ref fallisce,
  l'errore torna al controller."
- "L'ae con ae.id = assignedExerciseId esiste sempre: findByAssignedExercise
  ha trovato l'assegnazione proprio attraverso quell'ae. Il confronto degli
  id lo fa il service: il Domain Model non riceve id."
- "isEditable è falsa se l'assegnazione è in bozza oppure se la settimana è
  già trascorsa (Nota 2 di PT-09). La UI mostra solo le settimane
  modificabili, ma il service ripete il controllo."
- "customize confronta i valori ricevuti con i valori base: weight (attributo
  di assignedExercise), baseReps e baseRestTime. Salva un override solo per
  i valori diversi (Nota 1 di PT-09)."
- "update(assignment) salva a cascata le Week e gli AssignedExercise."
- "Ripristino (7a): stesso schema con resetAssignedExercise(assignedExerciseId,
  ptId), e resetCustomization() al posto di customize."
- "Passo 11: l'email all'atleta è fuori dal modello (Gestione Notifiche,
  vedi TODO)."

## D6 — PT-16 Duplicazione

**Lifeline:** `PT`, `:TrainingPlanController`, `:TrainingPlanService`,
`:TrainingPlanDAO`, `plan:TrainingPlan`.

1. `PT` → `:TrainingPlanController`: `duplicatePlan(planId, name)`
2. `:TrainingPlanController` → `:TrainingPlanService`:
   `duplicatePlan(planId, ptId, name)`
   1. `:TrainingPlanService` → `:TrainingPlanDAO`: `findById(planId)`

   2. ritorno: `plan`

   3. `:TrainingPlanService` → `:TrainingPlanDAO`: `findByPT(ptId)`

   4. ritorno: `plans`

   5. **`alt [plan assente oppure plan.getPT().id ≠ ptId]`**

      - ritorno: `errore: scheda non trovata`

      **`[esiste p in plans con p.getName() = name]`** (6a)

      - ritorno: `errore: esiste già una scheda con questo nome`

      **`[else]`**

      1. `:TrainingPlanService` → `plan`: `copy(name)`
         - **`ref PT-16 Copia Scheda`**, dentro l'attivazione di `copy`
      2. ritorno: `planCopy`
      3. `:TrainingPlanService` → `:TrainingPlanDAO`: `create(planCopy)`
      4. ritorno a `:TrainingPlanController`: `planCopy`
3. `:TrainingPlanController` → `PT` (ritorno): `mostra esito`: in caso di
   successo è il redirect alla configurazione delle sessioni della copia
   (PT-04), altrimenti il messaggio di errore e il ritorno al passo 4 del
   caso d'uso

**Note sul diagramma:**

- "ptId = PT autenticato."
- "findByPT è eseguito anche se la scheda non è trovata: così l'alt resta a
  un livello."
- "duplicatePlan è sempre permessa, anche se la scheda ha assegnazioni: non
  chiama isStructureEditable."
- "create(planCopy) salva a cascata i blocchi, le sessioni e le attività:
  sono parti della composizione e non hanno un DAO."
- "La copia non ha assegnazioni: la sua struttura è modificabile con PT-04."

## D7 — PT-16 Copia Scheda

È il dettaglio di `TrainingPlan.copy(name)`, richiamato con `ref` da D6. Come
D3, disegna **un solo percorso rappresentativo**: l'attività è un drop-set
applicato a un esercizio.

**Lifeline:** `:TrainingPlanService`, `plan:TrainingPlan`,
`block:MonthlyBlock`, `session:TrainingSession`,
`dropSet:DropSetDecorator`, `exercise:Exercise`, `exerciseCopy:Exercise`,
`dropSetCopy:DropSetDecorator`, `sessionCopy:TrainingSession`,
`blockCopy:MonthlyBlock`, `planCopy:TrainingPlan`.

1. `:TrainingPlanService` → `plan`: `copy(name)`
   1. **`loop [per ogni block in plan.getBlocks()]`**
      1. `plan` → `block`: `copy()`
         1. **`loop [per ogni session in block.getSessions()]`**
            1. `block` → `session`: `copy()`
               1. **`loop [per ogni activity in session.getActivities()]`**
                  1. `session` → `dropSet`: `copy()`
                     1. `dropSet` → `exercise`: `copy()` (sul figlio del decoratore)
                        1. `exercise` → `exerciseCopy`:
                           `«create» Exercise(exerciseType, reps, restTime, exerciseNotes)`
                     2. ritorno: `exerciseCopy`
                     3. `dropSet` → `dropSetCopy`:
                        `«create» DropSetDecorator(exerciseCopy, weightMultiplier)`
                  2. ritorno: `dropSetCopy`
               2. `session` → `sessionCopy`:
                  `«create» TrainingSession(activityCopies)`
            2. ritorno: `sessionCopy`
         2. `block` → `blockCopy`:
            `«create» MonthlyBlock(weeksCount, sessionCopies)`
      2. ritorno: `blockCopy`
   2. `plan` → `planCopy`:
      `«create» TrainingPlan(pt, name, description, blockCopies)`
2. ritorno: `planCopy`

**Note sul diagramma:**

- "Pattern Prototype: ogni oggetto copia sé stesso e chiede la copia alle
  sue parti. Il padre si crea dopo i figli, con i figli copiati."
- "Percorso rappresentativo: l'attività è un DropSetDecorator applicato a un
  Exercise. Superset chiama copy() su ogni figlio e crea
  Superset(childCopies). RestPause segue lo schema del DropSet."
- "activityCopies, sessionCopies e blockCopies raccolgono le copie nello
  stesso ordine dell'originale."
- "La copia condivide l'ExerciseType (catalogo in sola lettura) e il PT."
- "La copia condivide le Reps: sono immutabili (si creano solo con fixed,
  range e toFailure)." — vedi "Da decidere".

## Da decidere

- **Reps nella copia.** `Exercise` → `Reps` è una composizione, quindi a
  rigore due `Exercise` non possono avere le stesse `Reps`. Consiglio di
  **condividerle**: le implementazioni di `Reps` sono immutabili e si
  comportano come tipi di valore, e nel database si salvano comunque come
  righe dell'esercizio. L'alternativa è aggiungere `Reps.copy(): Reps`
  {abstract} e le tre implementazioni, con un messaggio in più in D7.
- **Ripristino (7a) di PT-09.** Ho messo il ripristino in una nota di D5
  perché è identico al salvataggio, a parte il metodo. Se vuoi un diagramma
  per ogni richiesta del PT, diventa `D5b PT-09 Ripristino`.

Dopo il disegno, nella SRS: aggiungere il pattern Prototype nella
descrizione dei sottopackage Exercise e TrainingPlan del Domain Model.
