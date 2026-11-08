# Business Logic: metodi per User, Gym e Coaching

Proposta di metodi per i service dei tre package, ricavata dai template dei
casi d'uso della SRS. Stile e notazione come `TrainingPlanService`. I getter
e i setter delle relazioni sono dati per presenti e non sono elencati.

## Regola: id oppure oggetto

Un metodo riceve l'oggetto (`pt: PT`, `athlete: Athlete`) quando crea
un'entità che ha un'associazione verso quell'oggetto. In tutti gli altri casi
riceve l'id (`ptId`, `athleteId`).

- **Oggetto.** Il metodo deve impostare l'associazione, quindi gli serve
  l'istanza. Il controller la carica con `UserService.getPT` o
  `UserService.getAthlete` e la passa al metodo. Così gli altri service non
  dipendono da `UserDAO`.
- **Id.** Il metodo usa l'id solo per un controllo di proprietà (per esempio
  `plan.getPT().getId() == ptId`) o come filtro nella query del DAO. Un oggetto
  costerebbe una query in più e non aggiungerebbe niente.

La regola vale per:

- `GymService.associatePT(in pt: PT, …)`, che crea uno `StaffAssignment`;
- `GymService.enrollAthlete(in athlete: Athlete, …)`, che crea le `Membership`.
  La chiama `UserService.registerAthlete` con l'atleta appena creato;
- `TrainingPlanService.addPlan(in pt: PT, …)`, che crea una `TrainingPlan`;
- `PlanAssignmentService.addAssignment(in athlete: Athlete, …)`, che crea un
  `PlanAssignment`. Riceve ancora `ptId`, perché lo usa per controllare che la
  scheda sia del PT.

Per questo `UserService` ha anche `getPT(in ptId: UUID): PT`.

## UserService (package `User`)

| Metodo | Casi d'uso |
|---|---|
| `authenticate(in email: string, in password: string): User` | U-01, passo 5. Se l'utente è un atleta, il controller chiama `Athlete.isProfileComplete()` per decidere se mandarlo ad A-01 (flusso 6a). |
| `requestPasswordReset(in email: string)` | U-02, passi 4–5 e 4a. Non restituisce nulla e non rivela se l'email esiste. |
| `isResetLinkValid(in token: string): bool` | U-02, passo 6 e 6a. |
| `resetPassword(in token: string, in newPassword: string)` | U-02, passi 9–9a. |
| `registerPT(in firstName: string, in lastName: string, in email: string, in password: string): PT` | PT-01, passi 5–6, 5a, 5b. |
| `registerAthlete(in ptId: UUID, in firstName: string, in lastName: string, in email: string, in gymIds: UUID [1..*]): Athlete` | PT-02, passi 5–6, 5a, 5b, 5c. Crea l'`Athlete`, il `PTAssignment` e la password temporanea, poi chiama `GymService.enrollAthlete`. |
| `getAthletesByPT(in ptId: UUID): Athlete [0..*]` | PT-08, passo 2. Solo atleti con `PTAssignment` attivo, ordinati per cognome. |
| `getAthlete(in athleteId: UUID, in ptId: UUID): Athlete` | PT-08, passo 4. Controlla che l'atleta sia del PT (Nota 4). |
| `hasActivePTAssignment(in athleteId: UUID, in ptId: UUID): bool` | Controllo usato da `getAthlete(athleteId, ptId)` e da `PlanAssignmentService`. Vero se il `PTAssignment` tra i due è attivo oggi. |
| `terminatePTAssignment(in athleteId: UUID, in ptId: UUID)` | PT-17, passo 5. Imposta `endDate` a oggi; ammesso solo se `isActive`. |
| `getAthlete(in athleteId: UUID): Athlete` | A-04, passo 2. |
| `completeProfile(in athleteId: UUID, in newPassword: string, in birthDate: LocalDate, in height: float, in weight: float): Athlete` | A-01, passi 5–6 e 5a. |
| `updatePersonalData(in athleteId: UUID, in birthDate: LocalDate, in height: float, in weight: float): Athlete` | A-04, passi 7 e 7a. |

`getAthlete` appare due volte: quella con `ptId` controlla il rapporto
PT–atleta, quella senza `ptId` serve all'atleta.

## GymService (package `Gym`)

| Metodo | Casi d'uso |
|---|---|
| `registerGym(in name: string, in address: Address, in phone: string): Gym` | PT-12, passi 6–7 e 6a. |
| `searchGyms(in name: string): Gym [0..*]` | PT-13, passo 4 e 4a. Serve anche a PT-12 (Nota 1). |
| `associatePT(in ptId: UUID, in gymId: UUID, in startDate: LocalDate): StaffAssignment` | PT-13, passi 8–9, 8a e 8b. |
| `getStaffAssignmentsByPT(in ptId: UUID): StaffAssignment [0..*]` | PT-14, passo 2, e PT-15, passo 2. Attive prima, poi le terminate. |
| `getActiveGymsByPT(in ptId: UUID): Gym [0..*]` | PT-02, passo 2. Se non ce ne sono, il caso d'uso non va mostrato (Nota 2). |
| `terminateStaffAssignment(in staffAssignmentId: UUID)` | PT-15, passo 6. Imposta `endDate` a oggi; ammesso solo se `isActive`. |
| `enrollAthlete(in athleteId: UUID, in gymIds: UUID [1..*], in startDate: LocalDate): Membership [1..*]` | PT-02, passo 6. |
| `getMembershipsByAthlete(in athleteId: UUID): Membership [0..*]` | A-06, passi 2 e 4. Serve anche ad A-02 (passo 3) e alla pagina di PT-08. |
| `getGym(in gymId: UUID): Gym` | Dettaglio in PT-14 (passo 4) e A-06 (passo 4). |

## AppointmentService (package `Coaching`)

| Metodo | Casi d'uso |
|---|---|
| `requestAppointment(in athleteId: UUID, in gymId: UUID, in dateTime: LocalDateTime, in reason: string): Appointment` | A-02, passi 6–7 e 6a. Crea l'appuntamento in `pending`. Il PT è quello attivo dell'atleta. Controlla che la palestra sia tra le sue iscrizioni. |
| `getAppointmentsByPT(in ptId: UUID, in status: BookingStatus [0..1]): Appointment [0..*]` | PT-06 passo 1 (con `pending`) e PT-07 passo 2 (senza filtro). |
| `getAppointmentsByAthlete(in athleteId: UUID): Appointment [0..*]` | A-05, passo 2. |
| `getAppointmentsByAthleteAndPT(in athleteId: UUID, in ptId: UUID): Appointment [0..*]` | PT-08, passo 4. |
| `getAppointment(in appointmentId: UUID): Appointment` | PT-06 passo 3, PT-07 passo 4, A-05 passo 4. |
| `confirmAppointment(in appointmentId: UUID): Appointment` | PT-06, passo 5. Ammesso solo se `pending`. |
| `rejectAppointment(in appointmentId: UUID, in rejectionReason: string): Appointment` | PT-06, flusso 4a. Ammesso solo se `pending`. |

## Punti aperti

1. **Email e notifiche.** Servono in PT-02 (invito), PT-06 (esito), A-02
   (nuova richiesta) e U-02 (link). Si aggiungono a PT-05 e PT-09. Nessun
   metodo le invia: serve un unico `NotificationService` (voce "Gestione
   Notifiche" del `TODO.md`).
2. **Token di reset password.** U-02 richiede un link con scadenza e uso
   singolo. Nel Domain Model non c'è nessuna entità per memorizzarlo (token,
   utente, scadenza, usato). Serve una classe nuova, oppure un token firmato
   senza stato: in quel caso `isResetLinkValid` non accede al DB.
3. **Quale PT riceve la richiesta di A-02.** Il form non chiede il PT.
   Presuppone che l'atleta abbia un solo `PTAssignment` attivo. Da controllare
   le molteplicità dell'associazione PT–Atleta in Gaphor: se l'atleta può avere
   più PT attivi, `requestAppointment` ha bisogno del parametro `ptId`.
4. **Flusso 6a di A-02.** Dice "richiesta in attesa già presente" senza dire
   se vale per atleta o per atleta e PT. Con un solo PT è la stessa cosa.
5. **Comportamento nel dominio.** Come per `PlanAssignment`, la regola "solo se
   pending" starebbe bene in `Appointment.confirm()` e
   `Appointment.reject(reason)`. Le regole di `isActive` ci sono già su
   `PTAssignment`, `Membership` e `StaffAssignment`.
6. **Controllo del PT in PT-02.** La SRS dice che si mostrano solo le palestre
   del PT. Il service deve controllare che i `gymIds` ricevuti siano tra quelle
   attive, altrimenti una richiesta costruita a mano aggira il form.
