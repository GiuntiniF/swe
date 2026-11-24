# Strato Controllers del diagramma delle classi

Status: ready-for-human

Specifica del package `Controllers` da disegnare in Gaphor. Le decisioni
vengono dalla sessione di grilling del 2026-11-21/24 (Q1–Q22). Il package
`App PT/Controllers` esiste già, vuoto. Finora i controller comparivano solo
nei diagrammi di sequenza (`PlanAssignmentController` in D1–D5,
`TrainingPlanController` in D6).

Ordine di lavoro (Q22): prima i diagrammi in Gaphor e l'export, poi la SRS
in un commit separato, come per i diagrammi di sequenza.

## Regole

1. **Copertura** (Q1). I controller coprono tutti i casi d'uso: U-01..02,
   PT-01..17 e A-01..06.
2. **Un controller per service** (Q2), nei sottopackage per area come gli
   altri strati. Un controller può chiamare più service. I metodi per il PT
   e quelli per l'atleta stanno nello stesso controller.
3. **Niente `ExerciseController`** (Q14). Nessun caso d'uso ha il passo
   principale in `ExerciseService`, che fornisce solo l'elenco degli
   esercizi a PT-04. I sottopackage sono quattro: `User`, `Gym`, `Coaching`,
   `TrainingPlan`.
4. **Sessione e ruolo impliciti** (Q3, Q7). Il login salva l'utente
   autenticato nella sessione. Gli altri metodi leggono da lì `ptId` o
   `athleteId` e li passano ai service. Un metodo è ammesso solo all'attore
   del suo caso d'uso, altrimenti il controller rimanda al login. Né la
   sessione né la CLI compaiono nel modello. Nella SRS si scrive "sessione",
   non "sessione HTTP".
5. **Uso del Domain Model in sola lettura** (Q4). I controller dipendono dal
   Domain Model. Usano gli oggetti di dominio solo per leggerli, passarli ai
   service e restituirli al chiamante. Non chiamano mai metodi che cambiano
   lo stato (`confirm()`, `moveTo()`, i setter). Esempi ammessi:
   `athlete.isProfileComplete()` (U-01), `plan.isConfigured()` e
   `plan.getEndDate(startDate)` (PT-05), `week.isCurrent(today)` e
   `week.hasCustomizations()` (PT-09, A-03).
6. **Tipo di ritorno** (Q4). Un metodo `show…` restituisce i dati che la
   pagina mostra, con il tipo del service. Un'azione non restituisce niente:
   l'esito, o il redirect, è il `mostra esito` dei diagrammi di sequenza.
   Fanno eccezione le azioni dopo cui il flusso prosegue sull'entità appena
   creata (Q23). Restituiscono quell'entità, la stessa che il service già
   restituisce:
   - `addPlan(…): TrainingPlan` → configurazione della scheda (PT-03 passo 7
     → PT-04);
   - `duplicatePlan(…): TrainingPlan` → configurazione della copia (PT-16
     passo 8 → PT-04);
   - `assignPlan(…): PlanAssignment` → `showLoadForm(assignment.id)` (D1);
   - `registerGym(…): Gym` → form di associazione con la palestra creata
     (PT-13 4a → passo 6).
7. **Quando c'è un metodo** (Q5, Q12). Un metodo per ogni richiesta
   dell'attore in cui il sistema legge o scrive dati. Non hanno un metodo:
   - i form vuoti;
   - le pagine che mostrano solo dati già restituiti dalla richiesta
     precedente: il dettaglio della sessione in PT-04 (passo 3), la data di
     fine in PT-05 (passo 4), il form dell'esercizio in PT-09 (passo 7), i
     form precompilati di PT-10, PT-16 e A-04;
   - le richieste di conferma ("Conferma Eliminazione", "Annulla").
8. **Parametri** (Q5). Solo i dati della richiesta: id dall'URL e campi del
   form. Mai `ptId` né `athleteId` dell'utente autenticato. Gli id seguono la
   struttura dall'esterno all'interno (`planId, blockId, sessionId, …`).
9. **Caricamento degli oggetti** (Q8). Il controller carica gli oggetti che
   la regola "id oppure oggetto" richiede (`getPT`, `getAthlete`,
   `getActivePT` di `UserService`) e li passa al service.
10. **A quale controller va un caso d'uso** (Q8). Va al controller del
    service che esegue il passo principale. Gli altri service servono solo a
    caricare gli oggetti (regola 9) o a riempire un form.
11. **Riuso** (Q15). Una richiesta uguale a una già coperta riusa quel
    metodo, anche se sta in un altro controller: PT-05 passo 3 usa
    `TrainingPlanController.showPlans()`, A-02 passo 1 usa
    `CoachingController.showAppointmentsForAthlete()`.
12. **Nomi** (Q10, Q16).
    - Se il metodo delega a un solo metodo del service, prende il suo nome.
    - Le letture usano il prefisso `show…`.
    - Il metodo dell'atleta ha il suffisso `ForAthlete` solo se esiste un
      metodo del PT con lo stesso nome.
    - I metodi già disegnati nei diagrammi di sequenza non cambiano nome:
      `assignPlan` delega ad `addAssignment`.
13. **Pagine che leggono da più service** (Q13). Le servono le classi
    contenitore `AthleteDetail` e `PlanConfiguration`. Referenziano oggetti
    di dominio e non ne copiano i campi.
14. **Notazione** (Q6, Q19).
    - Controller → service è un'associazione orientata ("Direct
      Association"), come service → DAO: senza nomi dei ruoli e senza
      molteplicità.
    - Nei diagrammi dei controller i service compaiono senza operazioni.
    - Le classi contenitore non hanno associazioni: gli attributi sono
      tipizzati come in `AssignedSessionView`.

## Come costruire i diagrammi in Gaphor (Q21)

Ogni operazione e attributo qui sotto è scritto nella sintassi che Gaphor
accetta. Una riga si incolla in una nuova riga della scheda delle operazioni
(o degli attributi) dell'editor delle proprietà. Gaphor ricava nome,
parametri `in`, tipo di ritorno e molteplicità (`umllex.parse_operation`).
Tutte le righe sono state verificate con il parser di Gaphor 3.3.2.

- Crea ogni diagramma con il tasto destro sul suo sottopackage nel browser
  del modello. Le classi nuove finiscono già nel package giusto.
- Non ricreare i service. Trascinali dal browser del modello nel diagramma,
  oppure usa `Ctrl+V` da un diagramma della Business Logic. Non usare
  `Ctrl+Shift+V`, che duplica gli elementi. Poi togli la spunta a
  "Show operations" nelle proprietà della vista.
- Scorciatoie: `c` per la classe. La "Direct Association" non ha una
  scorciatoia.

## Diagrammi

| Nome in Gaphor                     | Package               | Tipo            | File esportato                                     |
| ---------------------------------- | --------------------- | --------------- | -------------------------------------------------- |
| `Package Diagram of Controllers`   | `Controllers`         | PackageDiagram  | `Controllers/Package_Diagram_of_Controllers.pdf`   |
| `User`                             | `Controllers/User`    | ClassDiagram    | `Controllers/User.pdf`                             |
| `Gym`                              | `Controllers/Gym`     | ClassDiagram    | `Controllers/Gym.pdf`                              |
| `Coaching`                         | `Controllers/Coaching`| ClassDiagram    | `Controllers/Coaching.pdf`                         |
| `TrainingPlan`                     | `Controllers/TrainingPlan` | ClassDiagram | `Controllers/TrainingPlan.pdf`                   |

Lo script di export usa il primo package sotto la radice come cartella,
quindi i PDF finiscono in `diagrams/Controllers/`.

### Package Diagram of Controllers

Come il `Package Diagram of Business Logic`: i sottopackage di `Controllers`
con una dipendenza (`Shift+D`) verso i sottopackage di `BusinessLogic` che
usano.

| Da `Controllers/…` | Verso `BusinessLogic/…`                    |
| ------------------ | ------------------------------------------ |
| `User`             | `User`, `Gym`, `TrainingPlan`, `Coaching`  |
| `Gym`              | `Gym`, `User`                              |
| `Coaching`         | `Coaching`, `Gym`, `User`                  |
| `TrainingPlan`     | `TrainingPlan`, `Exercise`, `User`         |

### SystemArchitecture

Aggiungere una dipendenza da `Controllers` a `Domain Model` (Q4).

## Controllers/User

### UserController

Associazioni orientate verso `UserService`, `GymService`,
`PlanAssignmentService` e `CoachingService`.

```
login(email: string, password: string)
requestPasswordReset(email: string)
showResetForm(token: string)
resetPassword(token: string, newPassword: string)
registerPT(firstName: string, lastName: string, email: string, password: string)
showAthleteRegistrationForm(): Gym[0..*]
registerAthlete(firstName: string, lastName: string, email: string, gymIds: UUID[1..*])
showAthletes(): Athlete[0..*]
showAthlete(athleteId: UUID): AthleteDetail
terminatePTAssignment(athleteId: UUID)
completeProfile(newPassword: string, birthDate: LocalDate, height: float, weight: float)
showProfile(): Athlete
updatePersonalData(birthDate: LocalDate, height: float, weight: float)
```

| Metodo                        | Caso d'uso               | Chiama                                                                                                                                                                                                      |
| ----------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `login`                       | U-01, 5a, 6a             | `UserService.authenticate(email, password)`. Se l'utente è un atleta, `athlete.isProfileComplete()` decide se mandarlo ad A-01. Salva l'utente nella sessione.                                             |
| `requestPasswordReset`        | U-02 passi 3–5, 4a       | `UserService.requestPasswordReset(email)`                                                                                                                                                                  |
| `showResetForm`               | U-02 passi 6–7, 6a       | `UserService.isResetLinkValid(token)`                                                                                                                                                                      |
| `resetPassword`               | U-02 passi 8–10, 9a      | `UserService.resetPassword(token, newPassword)`                                                                                                                                                            |
| `registerPT`                  | PT-01, 5a, 5b            | `UserService.registerPT(firstName, lastName, email, password)`                                                                                                                                             |
| `showAthleteRegistrationForm` | PT-02 passo 2            | `GymService.getActiveGymsByPT(ptId)`                                                                                                                                                                       |
| `registerAthlete`             | PT-02, 5a–5c             | `UserService.registerAthlete(ptId, firstName, lastName, email, gymIds)`                                                                                                                                    |
| `showAthletes`                | PT-08 passo 2, 2a        | `UserService.getAthletesByPT(ptId)`                                                                                                                                                                        |
| `showAthlete`                 | PT-08 passo 4            | `UserService.getAthlete(athleteId, ptId)` per primo, perché controlla che l'atleta sia del PT. Poi `GymService.getMembershipsByAthlete(athleteId)`, `PlanAssignmentService.getAssignmentsByAthleteAndPT(athleteId, ptId)`, `CoachingService.getAppointmentsByAthleteAndPT(athleteId, ptId)`. |
| `terminatePTAssignment`       | PT-17                    | `UserService.terminatePTAssignment(athleteId, ptId)`                                                                                                                                                       |
| `completeProfile`             | A-01, 5a                 | `UserService.completeProfile(athleteId, newPassword, birthDate, height, weight)`                                                                                                                           |
| `showProfile`                 | A-04 passo 2             | `UserService.getAthlete(athleteId)`                                                                                                                                                                        |
| `updatePersonalData`          | A-04, 7a                 | `UserService.updatePersonalData(athleteId, birthDate, height, weight)`                                                                                                                                     |

### AthleteDetail

Classe contenitore della pagina di dettaglio di PT-08.

```
athlete: Athlete
memberships: Membership[0..*]
assignments: PlanAssignment[0..*]
appointments: Appointment[0..*]
```

## Controllers/Gym

### GymController

Associazioni orientate verso `GymService` e `UserService`.

```
registerGym(name: string, address: Address, phone: string): Gym
searchGyms(name: string): Gym[0..*]
associatePT(gymId: UUID, startDate: LocalDate)
showStaffAssignments(): StaffAssignment[0..*]
showStaffAssignment(staffAssignmentId: UUID): StaffAssignment
terminateStaffAssignment(staffAssignmentId: UUID)
showMemberships(): Membership[0..*]
showMembership(membershipId: UUID): Membership
```

| Metodo                     | Caso d'uso                | Chiama                                                                                       |
| -------------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| `registerGym`              | PT-12, 6a                 | `GymService.registerGym(name, address, phone)`                                               |
| `searchGyms`               | PT-13 passo 4, 4a         | `GymService.searchGyms(name)`                                                                |
| `associatePT`              | PT-13 passi 7–9, 8a, 8b   | `UserService.getPT(ptId)`, poi `GymService.associatePT(pt, gymId, startDate)`                |
| `showStaffAssignments`     | PT-14 passo 2, PT-15 passo 2 | `GymService.getStaffAssignmentsByPT(ptId)`                                                |
| `showStaffAssignment`      | PT-14 passo 4             | `GymService.getStaffAssignment(staffAssignmentId, ptId)`                                     |
| `terminateStaffAssignment` | PT-15                     | `GymService.terminateStaffAssignment(staffAssignmentId, ptId)`                               |
| `showMemberships`          | A-06 passo 2              | `GymService.getMembershipsByAthlete(athleteId)`                                              |
| `showMembership`           | A-06 passo 4              | `GymService.getMembership(membershipId, athleteId)`                                          |

## Controllers/Coaching

### CoachingController

Associazioni orientate verso `CoachingService`, `GymService` e
`UserService`.

```
showAppointments(status: BookingStatus[0..1]): Appointment[0..*]
showAppointment(appointmentId: UUID): Appointment
confirmAppointment(appointmentId: UUID)
rejectAppointment(appointmentId: UUID, rejectionReason: string)
showAppointmentsForAthlete(): Appointment[0..*]
showAppointmentForAthlete(appointmentId: UUID): Appointment
showAppointmentRequestForm(): Membership[0..*]
requestAppointment(gymId: UUID, dateTime: LocalDateTime, reason: string)
```

| Metodo                       | Caso d'uso                          | Chiama                                                                                                                                                                                                  |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `showAppointments`           | PT-06 passo 1 (`pending`), PT-07 passo 2 (senza filtro) (Q17) | `CoachingService.getAppointmentsByPT(ptId, status)`                                                                                                                       |
| `showAppointment`            | PT-06 passo 3, PT-07 passo 4        | `CoachingService.getAppointment(appointmentId, ptId)`                                                                                                                                                   |
| `confirmAppointment`         | PT-06 passi 4–6                     | `CoachingService.confirmAppointment(appointmentId, ptId)`                                                                                                                                               |
| `rejectAppointment`          | PT-06 4a                            | `CoachingService.rejectAppointment(appointmentId, ptId, rejectionReason)`                                                                                                                               |
| `showAppointmentsForAthlete` | A-05 passo 2, A-02 passo 1          | `CoachingService.getAppointmentsByAthlete(athleteId)`                                                                                                                                                   |
| `showAppointmentForAthlete`  | A-05 passo 4                        | `CoachingService.getAppointmentForAthlete(appointmentId, athleteId)`                                                                                                                                    |
| `showAppointmentRequestForm` | A-02 passo 3                        | `GymService.getMembershipsByAthlete(athleteId)`                                                                                                                                                         |
| `requestAppointment`         | A-02 passi 5–8, 6a                  | `UserService.getAthlete(athleteId)` e `UserService.getActivePT(athleteId)`, poi `CoachingService.requestAppointment(athlete, pt, gymId, dateTime, reason)`. Se `getActivePT` non restituisce un PT: `errore: nessun PT attivo` (Q18). |

Q18: A-02 copre già il caso dell'atleta senza PT, con la precondizione e la
Nota 2 ("il sistema non mostra il pulsante «Richiedi Appuntamento»"). Il
caso d'uso non cambia. Il ramo di errore nel controller serve contro una
richiesta costruita a mano, che non passa dalla pagina.

## Controllers/TrainingPlan

### TrainingPlanController

Associazioni orientate verso `TrainingPlanService`, `ExerciseService` e
`UserService`.

```
addPlan(name: string, description: string): TrainingPlan
showPlans(): TrainingPlan[0..*]
editPlan(planId: UUID, name: string, description: string)
deletePlan(planId: UUID)
duplicatePlan(planId: UUID, name: string): TrainingPlan
showPlanConfiguration(planId: UUID): PlanConfiguration
addMonthlyBlock(planId: UUID, weeksCount: int)
editMonthlyBlock(planId: UUID, blockId: UUID, weeksCount: int)
deleteMonthlyBlock(planId: UUID, blockId: UUID)
addTrainingSession(planId: UUID, blockId: UUID)
deleteTrainingSession(planId: UUID, blockId: UUID, sessionId: UUID)
showExerciseTypes(): ExerciseType[0..*]
showActivity(planId: UUID, blockId: UUID, sessionId: UUID, activityId: UUID): ActivitySpec
addActivityToSession(planId: UUID, blockId: UUID, sessionId: UUID, spec: ActivitySpec)
editActivityOfSession(planId: UUID, blockId: UUID, sessionId: UUID, activityId: UUID, spec: ActivitySpec)
removeActivityFromSession(planId: UUID, blockId: UUID, sessionId: UUID, activityId: UUID)
```

| Metodo                      | Caso d'uso                                | Chiama                                                                                         |
| --------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `addPlan`                   | PT-03, 5a                                 | `UserService.getPT(ptId)`, poi `TrainingPlanService.addPlan(pt, name, description)`            |
| `showPlans`                 | PT-10, PT-11, PT-16 passo 2; PT-05 passo 3 (Q15) | `TrainingPlanService.getPlanListByPT(ptId)`                                             |
| `editPlan`                  | PT-10, 7a                                 | `TrainingPlanService.editPlan(ptId, planId, name, description)`                                |
| `deletePlan`                | PT-11, 6a                                 | `TrainingPlanService.deletePlan(ptId, planId)`                                                 |
| `duplicatePlan`             | PT-16, 6a                                 | `TrainingPlanService.duplicatePlan(planId, ptId, name)` (D6)                                   |
| `showPlanConfiguration`     | PT-04 passo 2, 1a                         | `TrainingPlanService.getPlan(ptId, planId)` e `TrainingPlanService.isStructureEditable(planId)` |
| `addMonthlyBlock`           | PT-04 2a, 2b                              | `TrainingPlanService.addMonthlyBlock(ptId, planId, weeksCount)`                                |
| `editMonthlyBlock`          | PT-04 2d                                  | `TrainingPlanService.editMonthlyBlock(blockId, ptId, planId, weeksCount)`                      |
| `deleteMonthlyBlock`        | PT-04 2e                                  | `TrainingPlanService.deleteMonthlyBlock(blockId, ptId, planId)`                                |
| `addTrainingSession`        | PT-04 2c                                  | `TrainingPlanService.addTrainingSession(blockId, ptId, planId)`                                |
| `deleteTrainingSession`     | PT-04 4a                                  | `TrainingPlanService.deleteTrainingSession(sessionId, blockId, ptId, planId)`                  |
| `showExerciseTypes`         | PT-04 passo 7                             | `ExerciseService.getExerciseTypeList()`                                                        |
| `showActivity`              | PT-04 5a                                  | `TrainingPlanService.getActivitySpec(activityId, sessionId, blockId, planId, ptId)`            |
| `addActivityToSession`      | PT-04 passi 8–12                          | `TrainingPlanService.addActivityToSession(spec, sessionId, blockId, planId, ptId)`             |
| `editActivityOfSession`     | PT-04 5a                                  | `TrainingPlanService.editActivityOfSession(spec, activityId, sessionId, blockId, planId, ptId)` |
| `removeActivityFromSession` | PT-04 5c                                  | `TrainingPlanService.removeActivityFromSession(activityId, sessionId, blockId, planId, ptId)`  |

### PlanConfiguration

Classe contenitore della pagina di configurazione di PT-04. `editable` è
falso se la scheda ha almeno un'assegnazione (flusso 1a).

```
plan: TrainingPlan
editable: bool
```

### PlanAssignmentController

Associazioni orientate verso `PlanAssignmentService` e `UserService`.

```
assignPlan(athleteId: UUID, planId: UUID, startDate: LocalDate): PlanAssignment
showLoadForm(assignmentId: UUID): AssignedSessionView[0..*]
saveDraft(assignmentId: UUID, weights: WeightEntry[0..*])
discardDraft(assignmentId: UUID)
confirmAssignment(assignmentId: UUID, weights: WeightEntry[0..*])
moveAssignment(assignmentId: UUID, newStartDate: LocalDate)
showAssignment(assignmentId: UUID): PlanAssignment
showAssignmentWeek(assignmentId: UUID, weekId: UUID): AssignedSessionView[0..*]
customizeAssignedExercise(assignedExerciseId: UUID, weight: Weight, reps: Reps, restTime: Duration)
resetAssignedExercise(assignedExerciseId: UUID)
showConfirmedAssignments(): PlanAssignment[0..*]
showAssignmentForAthlete(assignmentId: UUID): PlanAssignment
showAssignmentWeekForAthlete(assignmentId: UUID, weekId: UUID): AssignedSessionView[0..*]
```

| Metodo                         | Caso d'uso                      | Chiama                                                                                                        |
| ------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `assignPlan`                   | PT-05 passi 4–6, 4b, 6a         | `UserService.getAthlete(athleteId)`, poi `PlanAssignmentService.addAssignment(athlete, planId, ptId, startDate)` (D1) |
| `showLoadForm`                 | PT-05 passo 7, 2a               | `PlanAssignmentService.getLoadForm(assignmentId, ptId)` (D3)                                                  |
| `saveDraft`                    | PT-05 8a                        | `PlanAssignmentService.saveDraft(assignmentId, ptId, weights)`                                                |
| `discardDraft`                 | PT-05 2b                        | `PlanAssignmentService.discardDraft(assignmentId, ptId)`                                                      |
| `confirmAssignment`            | PT-05 passi 8–11, 9a, 9b        | `PlanAssignmentService.confirmAssignment(assignmentId, ptId, weights)` (D4)                                   |
| `moveAssignment`               | PT-05 9b                        | `PlanAssignmentService.moveAssignment(assignmentId, ptId, newStartDate)`                                      |
| `showAssignment`               | PT-09 passo 3, 4a               | `PlanAssignmentService.getAssignment(assignmentId, ptId)`                                                     |
| `showAssignmentWeek`           | PT-09 passo 5                   | `PlanAssignmentService.getAssignmentWeek(assignmentId, weekId, ptId)`                                         |
| `customizeAssignedExercise`    | PT-09 passi 8–11                | `PlanAssignmentService.customizeAssignedExercise(assignedExerciseId, ptId, weight, reps, restTime)` (D5)      |
| `resetAssignedExercise`        | PT-09 7a                        | `PlanAssignmentService.resetAssignedExercise(assignedExerciseId, ptId)`                                       |
| `showConfirmedAssignments`     | A-03 passo 2, 2a                | `PlanAssignmentService.getConfirmedAssignmentsByAthlete(athleteId)`                                           |
| `showAssignmentForAthlete`     | A-03 passo 4                    | `PlanAssignmentService.getAssignmentForAthlete(assignmentId, athleteId)`                                      |
| `showAssignmentWeekForAthlete` | A-03 passo 6                    | `PlanAssignmentService.getAssignmentWeekForAthlete(assignmentId, weekId, athleteId)`                          |

In totale: 5 controller, 58 operazioni, 2 classi contenitore.

## Correzioni ai diagrammi di sequenza (Gaphor)

- In D3 (`PT-05 Form Carichi`) la lifeline dell'attore si chiama `:PT`. Negli
  altri diagrammi si chiama `PT`. Rinominarla in `PT`.

## Modifiche alla SRS (dopo l'export)

Tutte in Italiano Tecnico Semplificato.

1. **§ Architettura di Sistema.** Il package `Controllers` dipende anche dal
   package `Domain Model`: legge gli oggetti di dominio, li passa ai service
   e li restituisce al chiamante, ma non ne cambia lo stato.
2. **Nuova sottosezione `Controllers`**, dopo `DAO` e prima di `Diagrammi di
   sequenza` (Q20). Contiene:
   - un'introduzione con il package diagram;
   - le "Regole comuni": regole 4–13 di questa spec;
   - una sottosezione per sottopackage (`User`, `Gym`, `Coaching`,
     `TrainingPlan`), con la figura e la frase "Il sottopackage contiene…".
     `AthleteDetail` e `PlanConfiguration` sono descritte nella sottosezione
     del loro sottopackage.
3. **§ Diagrammi di sequenza, convenzioni.** "Il controller legge l'id dalla
   sessione HTTP" diventa "Il controller legge l'id dalla sessione".
4. **§ Business Logic, regola "Id oppure oggetto".** "Il chiamante carica
   l'oggetto…" diventa "Il controller carica l'oggetto…", tranne il caso di
   `UserService.registerAthlete`, che chiama `GymService.enrollAthlete`.

## Fuori ambito

- Logout: nessun caso d'uso lo descrive (Q9). Se serve, va prima aggiunto un
  caso d'uso U-03.
- Notifiche email (voce "Gestione Notifiche" del `TODO.md`).
- La CLI o un'altra interfaccia che chiama i controller.

## Punti aperti

Nessuno. L'ultimo (azioni che proseguono sull'entità appena creata) è
deciso in Q23: vedi la regola 6.
