# Sequence Diagram — PT-05 (Assegnazione Scheda)

Status: ready-for-human

Specifica testuale dei sequence diagram di PT-05 da disegnare in Gaphor.
Le decisioni vengono dalla sessione di grilling del 2026-11-12. PT-04 e PT-06
seguiranno con le stesse convenzioni e riusano il diagramma condiviso
"Controllo PT dell'atleta".

## Diagrammi

| #   | Nome in Gaphor             | File esportato                                  | Copre                                                           |
| --- | -------------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| D0  | `Controllo PT dell'atleta` | `SequenceDiagrams/Controllo_PT_dell_atleta.pdf` | controllo condiviso, richiamato con `ref`                       |
| D1  | `PT-05 Assegnazione`       | `SequenceDiagrams/PT_05_Assegnazione.pdf`       | passi 4–6, flussi 4b e 6a                                       |
| D2  | `PT-05 Creazione Week`     | `SequenceDiagrams/PT_05_Creazione_Week.pdf`     | creazione delle istanze settimanali, richiamata con `ref` da D1 |
| D3  | `PT-05 Form Carichi`       | `SequenceDiagrams/PT_05_Form_Carichi.pdf`       | passo 7 e flusso 2a, anteprima del drop-set                     |
| D4  | `PT-05 Conferma`           | `SequenceDiagrams/PT_05_Conferma.pdf`           | passi 8–11, flussi 9a e 9b                                      |

Posizione nel modello: package `SequenceDiagrams` sotto la radice `App PT`.
D0 va direttamente in `SequenceDiagrams`. D1–D4 vanno nel sottopackage
`SequenceDiagrams/PT-05`. Lo script di export usa il primo package sotto la
radice come cartella, quindi tutti i PDF finiscono in
`diagrams/SequenceDiagrams/`. I nomi dei file sono già verificati con
`escape_filename`.

Fuori ambito per ora: `saveDraft` (8a) e `discardDraft` (2b).

## Convenzioni comuni

- **Lifeline**, da sinistra a destra: `PT` (attore), il controller, i service,
  i DAO, gli oggetti del Domain Model. Non c'è la lifeline `DB`.
- **Nomi delle lifeline**: anonimi per i singleton (`:PlanAssignmentService`),
  con nome per gli oggetti di dominio (`assignment:PlanAssignment`). Un metodo
  statico è un messaggio alla lifeline della classe (nome senza i due
  punti). Oggi nessun diagramma di PT-05 ne ha.
- **`ptId`** è l'id del PT autenticato: il controller lo prende dalla sessione
  HTTP e lo passa ai service. Ogni diagramma che parte dal PT ha la nota
  "ptId = PT autenticato".
- **Messaggi di ritorno** tratteggiati, solo quando il valore viene usato dopo.
  Non si disegnano i ritorni `void`.
- **`«create»`**: la lifeline dell'oggetto creato parte all'altezza del
  messaggio di creazione.
- **Barre di attivazione** sempre presenti.
- **Errori**: frammenti `alt`. Il ramo di errore è un messaggio di ritorno
  `errore: …` dal service al controller, senza notazione di eccezioni. Il
  controller mostra l'esito al PT con **un solo** messaggio di ritorno
  `mostra esito` dopo il frammento, invece di uno per ramo.
- **Oggetto non trovato**: se una `findById` non trova l'oggetto, il service
  restituisce `errore: non trovato`. In D1 il caso sta nella guardia dell'`alt`.
  In D3 e D4 non si disegna e c'è la nota "Se findById non trova
  l'assegnazione, il service restituisce errore: non trovato".
- **`ref` "Controllo PT dell'atleta"**: se il controllo fallisce, il service
  restituisce l'errore al controller come negli altri rami `alt`. Ogni
  diagramma che usa il `ref` lo indica in una nota.
- **Accessor impliciti**: i getter e i setter di attributi e associazioni
  (`getPT()`, `getBlocks()`, `getSessions()`, `getActivities()`, `getWeeks()`,
  `getStatus()`, `setWeight()`, …) non sono nel modello, ma si usano. Nelle
  guardie e nei testi di ritorno si usano senza disegnare il messaggio.

## Modifiche al Domain Model (da fare in Gaphor)

Metodi da aggiungere:

| Classe           | Metodo                                                             | Usato in | Note                                                                                                                                               |
| ---------------- | ------------------------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PlanAssignment` | `getAssignedExercises(): AssignedExercise[0..*]`                   | D4       | tutti gli `AssignedExercise` di tutte le Week. La Business Logic non deve conoscere la composizione `PlanAssignment` → `Week` → `AssignedExercise` |
| `PlanAssignment` | `getMissingWeights(): AssignedExercise[0..*]`                      | D4       | gli `AssignedExercise` con `weight` assente (9a). Si appoggia a `getAssignedExercises()`                                                           |
| `PlanAssignment` | `confirm()`                                                        | D4       | porta lo `status` a `Confirmed`. È ammesso solo in `Draft`, come `moveTo`                                                                          |
| `Week`           | `findAssignedExercise(exercise: Exercise): AssignedExercise[0..1]` | D3       | unico per la nota "al più un AssignedExercise per ogni Exercise"                                                                                   |

Nessun metodo del Domain Model riceve un `UUID`: il dominio lavora con
oggetti e valori. La Business Logic passa dagli id agli oggetti (con
`findById` e confrontando gli id). Per questo non ci sono
`PlanAssignment.findAssignedExercise(id)` né `PlanAssignment.findWeek(weekId)`.

Criterio usato: un'operazione sta nel Domain Model se usa solo i dati
dell'oggetto e delle sue parti (`confirm`, `getMissingWeights`,
`getAssignedExercises`, `Week.findAssignedExercise`). Sta nella Business
Logic se le servono un DAO, un altro service, un id arrivato con la
richiesta o l'utente autenticato.

Costruttori che i diagrammi usano. Vanno aggiunti se vuoi che compaiano nel
diagramma delle classi:

- `PlanAssignment(plan: TrainingPlan, athlete: Athlete, startDate: LocalDate)`:
  `status = Draft`, crea le Week (D2);
- `Week(weekNumber: int, block: MonthlyBlock)`: crea gli `AssignedExercise`
  del blocco. `block` serve solo durante la costruzione e la Week non lo
  memorizza: `getMonthlyBlock()` resta derivato da `weekNumber`;
- `AssignedExercise(exercise: Exercise, session: TrainingSession)`.

## Modifiche alla Business Logic e alle view (da fare in Gaphor)

| Classe                  | Modifica                                                                                     | Usato in | Note                                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PlanAssignmentService` | aggiungere `getLoadForm(assignmentId: UUID, ptId: UUID): AssignedSessionView[0..*]`         | D3       | le view di tutte le sessioni di tutte le Week, ordinate per `weekNumber` e `sessionNumber`. Una sola `findById` e un solo controllo PT                                                |
| `PlanAssignmentService` | aggiungere `- buildSessionViews(week: Week): AssignedSessionView[0..*]` (privato)           | D3       | le view delle sessioni di una Week: blocco → sessioni → visitor. Lo usano `getLoadForm`, `getAssignmentWeek` e `getAssignmentWeekForAthlete`. Non fa controlli: è privato apposta |
| `PlanAssignmentService` | `getAssignmentWeek` e `getAssignmentWeekForAthlete`: ritorno da `AssignedSessionView` a `AssignedSessionView[0..*]` | —        | restituiscono le view di tutte le sessioni della Week. Restano per la vista una Week alla volta (A-03)                                                                               |
| `AssignedSessionView`   | aggiungere `weekId: UUID` e `weekNumber: int`                                                | D3       | servono per raggruppare per Week una lista piatta. Le Week dello stesso blocco hanno lo stesso `sessionId`, quindi senza `weekId` le view non si distinguono                          |

Un metodo pubblico che riceve il `PlanAssignment` (invece dell'id) non c'è:
non avrebbe `ptId` e salterebbe il controllo PT.

### Osservazioni sul modello emerse durante la specifica

1. `UserService.getActivePT(athleteId): PT` deve restituire `PT[0..1]`: un
   atleta può non avere un `PTAssignment` attivo, per esempio dopo la
   cessazione del rapporto. D0 si basa su `[0..1]`.
2. **Togliere** `PlanAssignment.computeEndDate(plan, startDate)` (statico):
   duplica `TrainingPlan.getEndDate(startDate)`, e il calcolo spetta alla
   scheda, che conosce i blocchi e il loro `weeksCount`. `/endDate` di
   `PlanAssignment` vale `plan.getEndDate(startDate)`; `canMoveTo` e `moveTo`
   usano `plan.getEndDate(newStart)`. D1 chiama `plan.getEndDate(startDate)`.
   Se sul diagramma c'è la nota che descrive `/endDate`, aggiornala.

## D0 — Controllo PT dell'atleta

Diagramma condiviso, richiamato con `ref Controllo PT dell'atleta(athleteId, ptId)`.

**Lifeline:** `:PlanAssignmentService`, `:UserService`, `:PTAssignmentDAO`,
`ptAssignment:PTAssignment`.

1. `:PlanAssignmentService` → `:UserService`: `getActivePT(athleteId)`
   1. `:UserService` → `:PTAssignmentDAO`: `findByAthlete(athleteId)`
   2. ritorno: `ptAssignments`
   3. **`loop [per ogni ptAssignment, finché non ne trova uno attivo]`**
      1. `:UserService` → `ptAssignment`: `isActive(today)`
      2. ritorno: `active`
   4. ritorno: `activePT` (il `getPT()` del `PTAssignment` attivo, oppure niente)
2. **`alt [activePT assente oppure activePT.id ≠ ptId]`**
   - il service si ferma con `errore: l'atleta non è seguito dal PT`
   - `[else]` il controllo è superato: nessun messaggio

**Note:** "today è la data odierna del sistema."

## D1 — PT-05 Assegnazione

**Lifeline:** `PT`, `:PlanAssignmentController`, `:UserService`, `:UserDAO`,
`:PlanAssignmentService`, `:TrainingPlanDAO`, `:PlanAssignmentDAO`,
`plan:TrainingPlan`, `assignment:PlanAssignment`.

1. `PT` → `:PlanAssignmentController`: `assignPlan(athleteId, planId, startDate)`
2. `:PlanAssignmentController` → `:UserService`: `getAthlete(athleteId)`
   1. `:UserService` → `:UserDAO`: `findById(athleteId)`
   2. ritorno: `athlete`
3. ritorno: `athlete`
4. `:PlanAssignmentController` → `:PlanAssignmentService`:
   `addAssignment(athlete, planId, ptId, startDate)`
   1. **`ref Controllo PT dell'atleta(athlete.id, ptId)`**, che copre
      `:PlanAssignmentService` e `:UserService`

   2. `:PlanAssignmentService` → `:TrainingPlanDAO`: `findById(planId)`

   3. ritorno: `plan`

   4. **`alt [plan assente oppure plan.getPT().id ≠ ptId]`**

      - ritorno a `:PlanAssignmentController`: `errore: scheda non trovata`

      **`[else]`**

      1. `:PlanAssignmentService` → `plan`: `isConfigured()`

      2. ritorno: `configured`

      3. `:PlanAssignmentService` → `plan`: `getEndDate(startDate)`

      4. ritorno: `endDate`

      5. `:PlanAssignmentService` → `:PlanAssignmentDAO`:
         `findOverlapping(athlete.id, startDate, endDate)`

      6. ritorno: `conflict`

      7. **`alt [configured = false]`** (4b)

         - ritorno: `errore: la scheda non è configurata`

         **`[conflict presente]`** (6a)

         - ritorno: `errore: sovrapposizione con conflict.getPlan().getName(),
           dal conflict.getStartDate() al conflict.getEndDate()`

         **`[else]`**

         1. `:PlanAssignmentService` → `assignment`:
            `«create» PlanAssignment(plan, athlete, startDate)`
            - **`ref PT-05 Creazione Week`**, dentro l'attivazione del costruttore
         2. `:PlanAssignmentService` → `:PlanAssignmentDAO`: `create(assignment)`
         3. ritorno a `:PlanAssignmentController`: `assignment`
5. `:PlanAssignmentController` → `PT` (ritorno): `mostra esito`: in caso di
   successo è il redirect al form dei carichi `showLoadForm(assignment.id)`
   (vedi D3), altrimenti il messaggio di errore e il ritorno al passo 5 del
   caso d'uso

**Note sul diagramma:**

- "ptId = PT autenticato."
- "Se il controllo del ref fallisce, il service restituisce l'errore al
  controller come negli altri rami alt."
- "findOverlapping considera solo le assegnazioni Confirmed (Nota 5 di PT-05)."
- "create(assignment) salva a cascata le Week e gli AssignedExercise: sono
  parti della composizione e non hanno un DAO."
- "getEndDate e findOverlapping sono eseguiti anche se la scheda non è
  configurata: così l'alt resta a un livello."

## D2 — PT-05 Creazione Week

È il dettaglio del costruttore di `PlanAssignment`, richiamato con `ref` da D1.

**Lifeline:** `:PlanAssignmentService`, `assignment:PlanAssignment`,
`plan:TrainingPlan`, `block:MonthlyBlock`, `week:Week`,
`session:TrainingSession`, `activity:WorkoutActivity`,
`assignedExercise:AssignedExercise`.

1. `:PlanAssignmentService` → `assignment`:
   `«create» PlanAssignment(plan, athlete, startDate)`
   1. `assignment` → `plan`: `getBlocks()`
   2. ritorno: `blocks`
   3. **`loop [per ogni block in blocks]`**
      1. `assignment` → `block`: `getWeeksCount()`
      2. ritorno: `weeksCount`
      3. **`loop [weeksCount volte]`**
         1. `assignment` → `week`: `«create» Week(weekNumber, block)`
            1. `week` → `block`: `getSessions()`
            2. ritorno: `sessions`
            3. **`loop [per ogni session in sessions]`**
               1. `week` → `session`: `getActivities()`
               2. ritorno: `activities`
               3. **`loop [per ogni activity in activities]`**
                  1. `week` → `activity`: `getExercises()`
                  2. ritorno: `exercises`
                  3. **`loop [per ogni exercise in exercises]`**
                     1. `week` → `assignedExercise`:
                        `«create» AssignedExercise(exercise, session)`

**Note sul diagramma:**

- "status = Draft alla creazione."
- "weekNumber parte da 1 e cresce di 1 a ogni Week, attraverso tutti i blocchi
  nell'ordine della scheda."
- "getExercises() restituisce le foglie Exercise dell'albero dell'attività
  (Superset e decoratori compresi)."
- "Week non memorizza block: getMonthlyBlock() si ricava da weekNumber."
- "I carichi (weight) sono assenti: il PT li inserisce con il form (D3, D4)."

Per evitare cinque livelli di `loop` puoi unire i loop sulle sessioni e sulle
attività in `loop [per ogni activity di ogni session del blocco]`. La
precisione basta, perché `session` resta il parametro di `AssignedExercise`.

## D3 — PT-05 Form Carichi

Passo 7 (subito dopo D1) e flusso 2a (ripresa della bozza). Il diagramma
disegna **un solo percorso rappresentativo**: un'attività che è un drop-set
applicato a un esercizio.

Il form mostra insieme tutte le sessioni di tutte le Week (passo 7 di PT-05).
Per questo il controller fa **una sola chiamata** a `getLoadForm`: il service
carica l'assegnazione e fa il controllo PT una volta sola, poi scorre le Week.

**Lifeline:** `PT`, `:PlanAssignmentController`, `:PlanAssignmentService`,
`:UserService`, `:PlanAssignmentDAO`, `assignment:PlanAssignment`,
`week:Week`, `block:MonthlyBlock`, `session:TrainingSession`,
`visitor:AssignedActivityVisitor`, `dropSet:DropSetDecorator`,
`exercise:Exercise`, `assignedExercise:AssignedExercise`,
`exerciseView:AssignedActivityView`, `dropSetView:AssignedActivityView`,
`sessionView:AssignedSessionView`.

1. `PT` → `:PlanAssignmentController`: `showLoadForm(assignmentId)`
2. `:PlanAssignmentController` → `:PlanAssignmentService`:
   `getLoadForm(assignmentId, ptId)`
   1. `:PlanAssignmentService` → `:PlanAssignmentDAO`: `findById(assignmentId)`
   2. ritorno: `assignment`
   3. **`ref Controllo PT dell'atleta(assignment.getAthlete().id, ptId)`**
   4. `:PlanAssignmentService` → `assignment`: `getWeeks()`
   5. ritorno: `weeks`
   6. **`loop [per ogni week in weeks]`**
      1. `:PlanAssignmentService` → `:PlanAssignmentService` (self-message):
         `buildSessionViews(week)`
         1. `:PlanAssignmentService` → `week`: `getMonthlyBlock()`
         2. ritorno: `block`
         3. `:PlanAssignmentService` → `block`: `getSessions()`
         4. ritorno: `sessions`
         5. **`loop [per ogni session in sessions]`**
            1. `:PlanAssignmentService` → `session`: `getActivities()`
            2. ritorno: `activities`
            3. **`loop [per ogni activity in activities]`**
               1. `:PlanAssignmentService` → `visitor`:
                  `«create» AssignedActivityVisitor(week)`
               2. `:PlanAssignmentService` → `dropSet`: `accept(visitor)`
                  1. `dropSet` → `visitor`: `visitDropSet(dropSet)`
                     1. `visitor` → `exercise`: `accept(visitor)` (sul figlio del decoratore)
                        1. `exercise` → `visitor`: `visitExercise(exercise)`
                           1. `visitor` → `week`: `findAssignedExercise(exercise)`
                           2. ritorno: `assignedExercise`
                           3. `visitor` → `assignedExercise`: `getEffectiveWeight()`
                           4. ritorno: `weight`
                           5. `visitor` → `assignedExercise`: `getEffectiveReps()`
                           6. ritorno: `reps`
                           7. `visitor` → `assignedExercise`: `getEffectiveRestTime()`
                           8. ritorno: `restTime`
                           9. `visitor` → `exerciseView`:
                              `«create» AssignedActivityView(Exercise, weight, reps, restTime, …)`
                     2. **`opt [weight presente]`**
                        1. `visitor` → `dropSet`: `getDropWeight(weight)`
                        2. ritorno: `dropWeight`
                     3. `visitor` → `dropSetView`:
                        `«create» AssignedActivityView(DropSet, weightMultiplier, dropWeights, children = [exerciseView])`
               3. `:PlanAssignmentService` → `visitor`: `getResult()`
               4. ritorno: `dropSetView`
            4. `:PlanAssignmentService` → `sessionView`:
               `«create» AssignedSessionView(week.id, weekNumber, session.id, sessionNumber, activities)`
         6. ritorno: `sessionViews` della `week`
3. ritorno: `sessionViews` di tutte le Week
4. `:PlanAssignmentController` → `PT` (ritorno): `mostra il form dei carichi`
   (le `sessionViews` raggruppate per Week)

**Note sul diagramma:**

- "ptId = PT autenticato."
- "Se findById non trova l'assegnazione, il service restituisce errore: non
  trovato. Se il controllo del ref fallisce, l'errore torna al controller."
- "buildSessionViews è un metodo privato del service. Lo usano anche
  getAssignmentWeek e getAssignmentWeekForAthlete."
- "Le sessionViews sono ordinate per weekNumber e sessionNumber. Il form le
  raggruppa per weekId."
- "I dati di testata del form (scheda, date) si leggono con
  getAssignment(assignmentId, ptId), in una richiesta separata anche
  asincrona. Non sono disegnati."
- "Percorso rappresentativo: l'attività è un DropSetDecorator applicato a un
  Exercise. Superset e RestPause seguono lo stesso schema: accept → visitX →
  accept sui figli → «create» AssignedActivityView."
- "Drop-set annidati: ogni DropSetDecorator applica getDropWeight al peso
  della discesa precedente."
- "Anteprima mentre il PT digita: la calcola la UI con il weightMultiplier
  della view. L'anteprima del server (dropWeights) si aggiorna a ogni
  caricamento del form."
- "Precompilazione dalla sessione precedente (Nota 1 di PT-05): la fa la UI."
- "Gli altri campi della view (exerciseTypeName, volumeText, notes,
  isCustomized) si leggono con gli accessor e non sono disegnati."

## D4 — PT-05 Conferma

**Lifeline:** `PT`, `:PlanAssignmentController`, `:PlanAssignmentService`,
`:UserService`, `:PlanAssignmentDAO`, `assignment:PlanAssignment`,
`assignedExercise:AssignedExercise`.

1. `PT` → `:PlanAssignmentController`: `confirmAssignment(assignmentId, weights)`
2. `:PlanAssignmentController` → `:PlanAssignmentService`:
   `confirmAssignment(assignmentId, ptId, weights)`
   1. `:PlanAssignmentService` → `:PlanAssignmentDAO`: `findById(assignmentId)`

   2. ritorno: `assignment`

   3. **`ref Controllo PT dell'atleta(assignment.getAthlete().id, ptId)`**

   4. **`alt [assignment.getStatus() ≠ Draft]`**

      - ritorno: `errore: l'assegnazione è già confermata`

      **`[else]`**

      1. `:PlanAssignmentService` → `assignment`: `getAssignedExercises()`
      2. ritorno: `assignedExercises`
      3. **`loop [per ogni entry in weights]`**
         1. **`alt [nessun ae in assignedExercises con ae.id = entry.assignedExerciseId]`**

            - ritorno: `errore: esercizio non appartenente all'assegnazione`
              (l'operazione termina e non salva niente)

            **`[else]`**

            1. `:PlanAssignmentService` → `assignedExercise`: `setWeight(entry.weight)`
               (`assignedExercise` è l'`ae` con `ae.id = entry.assignedExerciseId`)
      4. `:PlanAssignmentService` → `assignment`: `getMissingWeights()`
      5. ritorno: `missing`
      6. `:PlanAssignmentService` → `:PlanAssignmentDAO`:
         `findOverlapping(assignment.getAthlete().id, assignment.getStartDate(), assignment.getEndDate())`
      7. ritorno: `conflict`
      8. **`opt [missing vuoto e conflict assente]`**
         1. `:PlanAssignmentService` → `assignment`: `confirm()`
      9. `:PlanAssignmentService` → `:PlanAssignmentDAO`: `update(assignment)`
      10. **`alt [missing non vuoto]`** (9a)
      - ritorno: `errore: sessioni incomplete (missing)`

         **`[conflict presente]`** (9b)

      - ritorno: `errore: sovrapposizione con conflict.getPlan().getName(),
        dal conflict.getStartDate() al conflict.getEndDate()`

         **`[else]`**

      - ritorno: `assignment` (confermata)
3. `:PlanAssignmentController` → `PT` (ritorno): `mostra esito`: la conferma
   (passo 10) oppure le sessioni incomplete, ricavate da
   `ae.getSession()` per ogni `ae` in `missing` (9a), oppure il conflitto (9b)

**Note sul diagramma:**

- "ptId = PT autenticato."
- "Se findById non trova l'assegnazione, il service restituisce errore: non
  trovato. Se il controllo del ref fallisce, l'errore torna al controller."
- "update viene eseguito in ogni ramo: nei casi 9a e 9b l'assegnazione resta
  in bozza con i carichi inseriti."
- "Il confronto tra entry.assignedExerciseId e ae.id lo fa il service: il
  Domain Model non riceve id."
- "findOverlapping è chiamato senza excludedAssignmentId: la bozza non è
  Confirmed e la ricerca non la trova."
- "Passo 11: l'email all'atleta è fuori dal modello (Gestione Notifiche, vedi
  TODO)."

## Come disegnare i frammenti in Gaphor (da decidere)

Gaphor 3.3.2, la versione del modello, ha nella sezione Interactions solo
Interaction, Lifeline, Execution Specification, Message e Reflexive message.
**Non ha `CombinedFragment` (`alt`, `loop`, `opt`) né `InteractionUse`
(`ref`).** Le alternative:

- **A — Interaction come cornice del frammento.** Un elemento Interaction
  chiamato `alt [guardia]`, `loop [...]` o `ref Nome` disegna già la cornice
  con l'etichetta a pentagono in alto a sinistra. Gli operandi di `alt` si
  separano con una Line tratteggiata del toolbox General, e le guardie degli
  operandi successivi al primo sono piccoli Comment. Effetti collaterali:
  - ogni cornice crea un `UML.Interaction` in più nel model browser;
  - le lifeline nuove si agganciano alla prima Interaction del package, quindi
    disegna prima tutte le lifeline e poi le cornici;
  - se la cornice risulta piena e copre le lifeline, aggiungi allo stylesheet
    `interaction { background-color: transparent; }`.
- **B — Box del toolbox General con un Comment per l'etichetta.** Il modello
  resta pulito, ma l'etichetta non ha la forma a pentagono dello standard.

Consiglio **A**, perché il risultato è più vicino alla notazione UML. Prima
di disegnare tutto conviene provarlo su D0, che è il diagramma più piccolo.
