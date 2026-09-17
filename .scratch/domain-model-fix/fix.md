# Fix del modello di dominio

File da modificare: `docs/softwarereqspec/src/diagrams/class/domain_model.gaphor` (Gaphor 3.3.2).

Analisi del 2026-09-11. Ogni punto è stato verificato sull'XML del file e sugli export PNG dei diagrammi. Le modifiche vanno applicate a mano in Gaphor. Alla fine il file va riletto per controllarle.

Molteplicità, tipi, visibilità e nomi appartengono al modello: si cambiano una volta e si aggiornano in tutti i diagrammi. Note, etichette e posizioni appartengono invece al singolo diagramma.

Convenzioni usate in tutte le voci:

- attributi con visibilità `-`;
- tipi primitivi minuscoli (`string`, `int`, `float`, `boolean`), tipi valore in PascalCase (`LocalDate`, `LocalDateTime`, `Duration`);
- valori delle enumerazioni in maiuscolo (`DRAFT`, `KG`).

## Ordine consigliato

1. Sezione 1 (errori): tutta, prima di inviare.
2. Le decisioni aperte (2.4, 2.5, 2.6 e "Carichi alla conferma" in sezione 3): conviene prenderle subito, perché cambiano altre voci.
3. Il resto della sezione 2, poi le sezioni 3, 4 e 5.

## Come si aggiunge una nota in Gaphor

Gli strumenti sono nella sezione *General* della toolbox:

- **Comment** (tasto `K`): clicca sul diagramma per creare la nota. Con un doppio clic scrivi il testo: `Invio` conferma, `Shift+Invio` va a capo.
- **Comment line** (`Shift+K`): trascina una linea dalla nota all'elemento. La linea si aggancia a classi e interfacce, ma anche alle linee delle associazioni, e una nota può avere più linee.

Note e linee compaiono anche negli export PNG e PDF.

Per mettere la stessa nota in più diagrammi:

1. seleziona solo la nota, senza la linea, e premi `Ctrl+C`;
2. nell'altro diagramma premi `Ctrl+V`: con *Paste* Gaphor riusa lo stesso commento, quindi il testo corretto in un diagramma cambia ovunque (`Ctrl+Shift+V` invece crea una copia indipendente);
3. ridisegna la Comment line in quel diagramma.

Le note `{xor}` della voce 1.1 si agganciano alla classe (`WorkoutActivity` o `Reps`) nei diagrammi per package, dove non tutte le associazioni coinvolte sono visibili. Nel `_Domain Model` le associazioni sono tutte visibili, quindi lì puoi collegare la nota con una linea a ciascuna di esse: è la resa più vicina alla notazione UML. Gaphor non ha uno strumento per i vincoli tra associazioni.

## 1. Errori

### 1.1 Molteplicità del contenitore nelle composizioni

Oggi il lato del contenitore vale `1` in cinque associazioni. Ne segue che ogni `WorkoutActivity` deve stare contemporaneamente in una `TrainingSession`, in una `Superset` e dentro un `WorkoutActivityDecorator`. Il decoratore è a sua volta una `WorkoutActivity`, quindi la catena non finisce mai. Allo stesso modo ogni `Reps` deve appartenere sia a un `Exercise` sia a un `AssignedExercise`. Nessuna scheda reale soddisfa il modello.

In tutto il file, "lato X" indica il numero scritto accanto alla classe X, all'estremità della linea che tocca X.

- [x] `TrainingSession` ◆— `WorkoutActivity` (associazione `exercises`): lato `TrainingSession` da `1` a `0..1`
- [x] `Superset` ◆— `WorkoutActivity`: lato `Superset` da `1` a `0..1`; lato `WorkoutActivity` da `1..*` a `2..*` (una superserie ha almeno due attività)
- [x] `WorkoutActivityDecorator` ◇— `WorkoutActivity`: il numero vicino al rombo ◇, accanto a `WorkoutActivityDecorator`, passa da `1` a `0..1`. Il numero vicino alla freccia, accanto a `WorkoutActivity`, resta `1`: un decoratore avvolge sempre esattamente un'attività.
  **Da correggere (verifica del 2026-09-11):** i due numeri sono invertiti. Oggi c'è `0..1` vicino alla freccia e `1` vicino al rombo.
- [x] `Exercise` ◆— `Reps`: lato `Exercise` da `1` a `0..1`
- [x] `AssignedExercise` ◆— `Reps`: lato `AssignedExercise` da `1` a `0..1`
- [x] Nota collegata alla classe `WorkoutActivity`, in ogni diagramma dove compare (`Exercises`, `TrainingPlan`, `_Domain Model`):
  `{xor} Ogni WorkoutActivity ha esattamente un contenitore diretto: una TrainingSession, una Superset o un WorkoutActivityDecorator. Risalendo i contenitori si arriva sempre a una TrainingSession: non sono ammessi cicli.`
  La seconda frase è necessaria. Senza, questa situazione rispetterebbe le molteplicità: un `DropSetDecorator` avvolge una `Superset`, e quella `Superset` contiene lo stesso decoratore. Ognuno dei due ha esattamente un contenitore, ma nessuno sta in una sessione. Dalla `TrainingSession` in su non serve altro: le molteplicità `1` verso `MonthlyBlock` e `TrainingPlan` legano già ogni sessione alla sua scheda.
  **Da completare (verifica del 2026-09-11):** la nota c'è solo in `Exercises` e le manca il prefisso `{xor}`. Nel campo note dell'interfaccia `WorkoutActivity` è rimasta anche la prima versione del testo: cancellala.
- [x] Nota collegata all'interfaccia `Reps`, negli stessi diagrammi:
  `{xor} Ogni Reps appartiene a un Exercise oppure a un AssignedExercise.`
  **Da completare (verifica del 2026-09-11):** la nota c'è solo in `Exercises` e le manca il prefisso `{xor}`. La linea è agganciata a `Reps` ma non alla nota: trascinane l'estremità sulla nota finché la nota si evidenzia.

### 1.2 La settimana dell'assegnazione: `AssignedWeek`

`MonthlyBlock` contiene `TrainingSession [1..7]`, cioè la settimana tipo, ripetuta per 4 settimane. `AssignedExercise` però è legato solo a `TrainingSession` ed `Exercise`. Quindi un esercizio ha lo stesso carico e le stesse serie in tutte e 4 le settimane del blocco. Questo contraddice:

- lo statement, secondo cui il peso varia "da allenamento a allenamento";
- PT-05, dove i carichi si inseriscono "sessione per sessione" e si precompilano "con i carichi della sessione precedente";
- PT-09, che personalizza "la settimana scelta".

**Decisione (2026-09-11):** la settimana diventa una classe dell'assegnazione, `AssignedWeek`. Sono state scartate due alternative:

- **attributo `week : int` in `AssignedExercise`:** la settimana resterebbe un numero ripetuto su ogni riga, e la logica per settimana di PT-09 e A-03 finirebbe in operazioni di `PlanAssignment` con un parametro `week`;
- **`WeeklyBlock` nella scheda** (`MonthlyBlock ◆ 4 WeeklyBlock ◆ TrainingSession`): sessioni ed esercizi andrebbero copiati 4 volte per blocco, e la regola "la tipologia di esercizi varia solo da mese a mese" non sarebbe più garantita dalla struttura. L'unico vantaggio, variare serie e ripetizioni di settimana in settimana nella scheda, è la progressione che il TODO ha tolto dal perimetro.

La scheda non cambia. Nell'assegnazione la struttura diventa:

```
PlanAssignment 1 ◆───── 1..* AssignedWeek 1 ◆───── 0..* AssignedExercise
                                                         ├── 1 TrainingSession
                                                         └── 1 Exercise
```

Passi in Gaphor, in quest'ordine:

- [x] **Elimina la composizione `PlanAssignment` ◆— `AssignedExercise`** sia dal diagramma `TrainingPlan` sia dal `_Domain Model`. Sulla tua installazione è attiva l'opzione *Remove unused elements*: quando la togli dall'ultimo diagramma, Gaphor la elimina anche dal modello e lo segnala con il messaggio "Removed unused elements from the model".

- [x] **Crea la classe `AssignedWeek`** nel diagramma `TrainingPlan`, così finisce nel package `TrainingPlan`. Contenuto:
  
  - `- number : int`
  - `- /startDate : LocalDate`
  - `- /endDate : LocalDate`
  - `+ isCurrent(today : LocalDate) : boolean`
  - `+ isEditable(today : LocalDate) : boolean`
  - `+ hasCustomizations() : boolean`
  
  Se scrivi `/` prima del nome, Gaphor segna l'attributo come derivato.

- [x] **`AssignedExercise`:** aggiungi `+ isCustomized() : boolean`

- [x] **Disegna `PlanAssignment` ◆— `AssignedWeek`** con lo strumento *Composite Association*, trascinando **da `PlanAssignment` verso `AssignedWeek`**: il rombo compare sulla classe da cui parti. Poi:
  
  - numero accanto a `PlanAssignment`, vicino al rombo: `1`;
  - numero accanto ad `AssignedWeek`: `1..*`;
  - lo strumento mette una freccia su `AssignedWeek`: su quel lato imposta *Unknown navigation*, come per le altre associazioni (sezione 4, Navigabilità).

- [x] **Disegna `AssignedWeek` ◆— `AssignedExercise`** allo stesso modo, trascinando da `AssignedWeek` verso `AssignedExercise`:
  
  - numero accanto ad `AssignedWeek`, vicino al rombo: `1`;
  - numero accanto ad `AssignedExercise`: `0..*` (in bozza una settimana può non avere ancora carichi);
  - *Unknown navigation* sul lato `AssignedExercise`.

- [ ] **Nel `_Domain Model`:** trascina `AssignedWeek` dal browser del modello **dentro** il riquadro `TrainingPlan`, poi traccia le due linee tra le stesse classi con lo strumento *Association*. Quando tra due classi esiste già un'associazione che in quel diagramma non compare, Gaphor riusa quella, con molteplicità e rombo già impostati, invece di crearne una nuova.

- [x] **Nota su `AssignedWeek`** (diagrammi `TrainingPlan` e `_Domain Model`):
  `Una PlanAssignment ha 4 AssignedWeek per ogni MonthlyBlock della sua TrainingPlan, numerate da 1 a 4 × numero di blocchi. startDate = PlanAssignment.startDate + (number − 1) × 7 giorni; endDate = startDate + 6 giorni.`

Il vincolo che prima stava qui in un'unica nota è in realtà due vincoli distinti, e conviene tenerli separati: ognuno si aggancia all'associazione che descrive, invece che tutti alla classe. Il terzo pezzo della vecchia nota — "l'`Exercise` è contenuto [...] nella `TrainingSession`" — non è ripetuto: è già la nota `{xor}` di `WorkoutActivity` in 1.1.

- [x] **Nota di unicità, sull'associazione `AssignedWeek`◆—`AssignedExercise`** (diagrammi `TrainingPlan` e `_Domain Model`), agganciata a quella linea o ad `AssignedExercise` accanto ad essa:
  `In una AssignedWeek c'è al più un AssignedExercise per ogni Exercise.`
  
  In UML questo è il caso da manuale per un'**associazione qualificata**: `Exercise` come qualificatore sul lato `AssignedWeek`, `AssignedExercise` a `0..1` sull'altro lato — il qualificatore funziona come la chiave di una mappa. Gaphor 3.3.2 però non la supporta: `qualifier` non esiste nel metamodello che implementa (l'ho verificato nei sorgenti), non solo nell'interfaccia. Resta quindi una nota.

- [ ] **Nota di coerenza, su `AssignedExercise`**, vicino all'associazione con `TrainingSession` (diagrammi `TrainingPlan` e `_Domain Model`):
  `La TrainingSession collegata appartiene al MonthlyBlock della TrainingPlan dell'assegnazione con order = ⌈number / 4⌉, dove number è quello della AssignedWeek a cui appartiene questo AssignedExercise. (Il contenimento dell'Exercise nella TrainingSession, anche dentro Superset o decoratori, è nella nota {xor} di WorkoutActivity — voce 1.1.)`
  
  Il `4` è la durata fissa del blocco (voce 2.6): se scegli la costante `WEEKS_PER_BLOCK`, scrivi quella. La nota assume che `MonthlyBlock.order` parta da 1. Questo vincolo lega due percorsi indipendenti che partono entrambi da `PlanAssignment` — uno passa per `AssignedWeek.number`, l'altro per `TrainingSession.MonthlyBlock.order` — quindi non è esprimibile con molteplicità o composizioni: resta nota in ogni caso, indipendentemente dal supporto di Gaphor.

Significato delle operazioni. Non va scritto nel diagramma: serve per l'implementazione e per spiegarle al professore.

- `isCurrent(today)`: vero se `startDate ≤ today ≤ endDate`. Serve a evidenziare la settimana corrente (PT-09 passo 3, A-03 passo 4).
- `isEditable(today)`: vero se l'assegnazione è `CONFIRMED` e `endDate ≥ today`, cioè se la settimana è quella corrente o una successiva (PT-09, precondizione e Nota 2).
- `hasCustomizations()`: vero se almeno uno dei suoi `AssignedExercise` è personalizzato (PT-09 passo 3).
- `AssignedExercise.isCustomized()`: vero se serie, ripetizioni o recupero sono diversi da quelli dell'`Exercise`. Il carico non conta: la scheda non ne definisce, quindi non c'è un valore a cui tornare con "Ripristina" (PT-09 flusso 7a).

Le settimane si creano tutte insieme all'assegnazione, anche quando è in bozza. Le loro date dipendono solo da `PlanAssignment.startDate`, quindi quando `moveTo()` sposta l'assegnazione, le settimane la seguono senza modifiche.

### 1.3 Firme dell'interfaccia `WorkoutActivity`

Le classi che realizzano l'interfaccia non ne implementano le operazioni:

- `Superset` e `WorkoutActivityDecorator` usano `getVolumeValue()` e `getVolumeDisplay()` al posto di `getVolume()` e `getVolumeText()`;
- nessuna delle tre classi ha `getExecutionNotes()`;
- `Exercise` non ha `getExerciseType()` e restituisce il recupero come `int`, mentre l'attributo è `Duration`.

Inoltre `getExecutionNotes()` non ha un dato da restituire: le "altre note esecutive" di PT-04 (passo 9) non compaiono nel modello.

Firme proposte, da usare identiche ovunque:

```
getVolume() : int
getVolumeText() : string
getRestTime() : Duration
getExerciseTypes() : ExerciseType[1..*]
getExecutionNotes() : string
```

`getExerciseType` diventa plurale perché una `Superset` restituisce più tipi di esercizio.

- [x] `WorkoutActivity`: imposta le cinque firme e spunta *Abstract* su tutte le operazioni, come già in `Reps`
- [x] `Exercise`:
  - `getRestTime() : int` diventa `getRestTime() : Duration`
  - aggiungi `getExerciseTypes() : ExerciseType[1..*]` e `getExecutionNotes() : string`
  - aggiungi l'attributo `- executionNotes : string[0..1]`
- [x] `Superset`:
  - `getVolumeValue() : int` diventa `getVolume() : int`
  - `getVolumeDisplay() : string` diventa `getVolumeText() : string`
  - `getExerciseType() : ExerciseType[1..*]` diventa `getExerciseTypes() : ExerciseType[1..*]`
  - aggiungi `getExecutionNotes() : string`
- [x] `WorkoutActivityDecorator`:
  - `getVolumeValue()` diventa `getVolume() : int`
  - `getVolumeDisplay()` diventa `getVolumeText() : string`
  - `getRestTime()` diventa `getRestTime() : Duration`
  - `getExerciseType()` diventa `getExerciseTypes() : ExerciseType[1..*]`
  - aggiungi `getExecutionNotes() : string`
- [x] `DropSetDecorator`:
  - `getVolumeValue() : int` diventa `getVolume() : int`
  - `getVolumeDisplay() : string` diventa `getVolumeText() : string`
- [x] `FixedReps`, `RangeReps`, `FailureReps`: `isToFailure() : bool` diventa `isToFailure() : boolean`

### 1.4 `TrainingSession.getTotalLoad()`

La SRS ("Struttura di una scheda") dice che la scheda non definisce i carichi: i carichi stanno in `AssignedExercise`. Una `TrainingSession` non ha quindi i dati per calcolare un carico totale.

- [x] `TrainingSession`: elimina `getTotalLoad()`
- [x] (facoltativo) `AssignedWeek`: aggiungi `getTotalLoad(session : TrainingSession) : Weight`
- [x] `TrainingSession`: `getTotalVolume()` diventa `getTotalVolume() : int`

### 1.5 `WeightMeasureUnit` non definito

L'attributo `Weight.weightMeasureUnit` ha tipo `WeightMeasureUnit`, ma questa enumerazione non esiste nel modello.

- [x] Package `Shared`: crea `«enumeration» WeightMeasureUnit` con i valori `KG` e `LB`
- [ ] Sposta `Weight` dal package `Exercises` al package `Shared`. Nessuna classe di `Exercises` lo usa: lo usa solo `AssignedExercise`. Puoi spostarlo nel browser del modello, oppure nel `_Domain Model` trascinandolo dentro il riquadro `Shared`: in Gaphor trascinare una classe dentro un package ne cambia il proprietario. Controlla poi nel browser che stia sotto `Shared`.
- [ ] Diagramma `Shared`: aggiungi `Weight` e `WeightMeasureUnit`. **Solo dopo** togli `Weight` dal diagramma `Exercises`; resta visibile in `TrainingPlan`.

## 2. Coerenza con la SRS

### 2.1 Valori delle enumerazioni

- [x] `AssignmentStatus`: `Draft` diventa `DRAFT`, `Completed` diventa `CONFIRMED`
  La SRS parla di assegnazione "confermata". "Completed" si legge come "terminata", e PT-05 (Nota 5) distingue proprio lo stato di bozza dal periodo di allenamento.
- [x] `BookingStatus`: `pending`, `confirmed`, `rejected` diventano `PENDING`, `CONFIRMED`, `REJECTED`

### 2.2 Profilo incompleto dell'atleta

PT-02 crea l'atleta con solo nome, cognome ed email. Data di nascita, altezza e peso arrivano dopo, con A-01. Con molteplicità `1` l'atleta appena creato non è rappresentabile, e il sistema non ha modo di riconoscere il profilo incompleto (U-01, flusso 6a).

- [x] `Athlete`:
  - `birthDate : LocalDate` diventa `birthDate : LocalDate[0..1]`
  - `height : float` diventa `height : float[0..1]`
  - `weight : float` diventa `weight : float[0..1]`
- [x] `Athlete`: aggiungi `isProfileComplete() : boolean` (vero quando i tre attributi sono valorizzati)

### 2.3 Da `CoachingSession` ad `Appointment`

Nel TODO la terminologia è fissata: l'incontro con il PT è un "appuntamento", mentre "sessione di allenamento" indica solo l'allenamento dentro la scheda. Il nome `CoachingSession` si confonde con `TrainingSession`.

- [x] Rinomina la classe `CoachingSession` in `Appointment`
- [x] Rinomina l'attributo `reasonForSession` in `reason`
- [x] SRS, PT-06 passo 5 ("Il sistema crea nel database l'appuntamento"): con una sola classe dotata di stato, il sistema non crea un appuntamento nuovo ma conferma la richiesta. Riformula il passo.

### 2.4 Palestre — DECISIONE

Nessun caso d'uso inserisce le palestre: non le chiedono i form di PT-02, A-01 e A-04, e A-02 non chiede la palestra dell'appuntamento. PT-06 (passo 3) e PT-08 (passo 4) però le mostrano.

- [ ] **A — tenerle:**
  - aggiungi la scelta delle palestre ai form di A-01 e A-04 (associazione `Athlete`–`Gym`);
  - aggiungi la palestra al form di A-02 (associazione `Appointment`–`Gym`);
  - stabilisci chi crea le `Gym`: un caso d'uso oppure una nota che le dichiara precaricate.
- [ ] **B — toglierle:**
  - elimina le associazioni `Athlete`–`Gym` e `Appointment`–`Gym`;
  - elimina `Gym` e `Address`;
  - togli le palestre da PT-06 (passo 3) e PT-08 (passo 4).

### 2.5 Sessioni a settimana — DECISIONE

PT-03 chiede il "numero di sessioni di allenamento settimanali" alla creazione della scheda, ma `TrainingPlan` non ha questo dato. E con `1..7` ogni `MonthlyBlock` può avere un numero di sessioni diverso.

- [ ] **A — sulla scheda:** aggiungi a `TrainingPlan` l'attributo `- sessionsPerWeek : int` e la nota
  `Ogni MonthlyBlock della scheda ha esattamente sessionsPerWeek TrainingSession (1..7).`
- [x] **B — per blocco:** togli il campo dal passo 2 di PT-03; il numero di sessioni lo decide ogni blocco, in PT-04.

### 2.6 `weeksCount` — DECISIONE

PT-05 (Nota 3) dice che ogni blocco dura sempre 4 settimane. L'attributo `weeksCount : int = 4` invece fa pensare a una durata variabile da blocco a blocco.

- [ ] **A (consigliata):** elimina `weeksCount` da `MonthlyBlock` e scrivi la regola nella nota di `/endDate` (sezione 3)
- [ ] **B:** rendilo una costante: rinominalo `WEEKS_PER_BLOCK : int = 4` e spunta *ReadOnly* e *Static* nella lista degli attributi

## 3. Vincoli da aggiungere come note

Sono le regole di dominio principali, e oggi nel diagramma non compaiono. Il testo è pronto da incollare.

- [ ] Su `Athlete` (diagramma `User`):
  `Le PlanAssignment CONFIRMED di un atleta non si sovrappongono: per due assegnazioni distinte a1 e a2 vale a1.endDate < a2.startDate oppure a2.endDate < a1.startDate. Le bozze non contano.`
- [ ] Su `PlanAssignment` (diagramma `TrainingPlan`):
  `endDate = startDate + (28 × numero di MonthlyBlock della TrainingPlan − 1) giorni.`
- [ ] **Carichi alla conferma — DECISIONE.** In bozza i carichi possono mancare (PT-05, flusso 8a).
  - **A (consigliata):** un `AssignedExercise` si crea solo quando il PT ne inserisce il carico, e `weight` resta obbligatorio. Nota su `PlanAssignment`:
    `Se status = CONFIRMED, in ogni AssignedWeek esiste un AssignedExercise per ogni Exercise contenuto nelle TrainingSession del MonthlyBlock di quella settimana.`
  - **B:** `AssignedExercise.weight : Weight` diventa `weight : Weight[0..1]`. Stessa nota, con in più: `e ciascuno ha weight valorizzato.`
- [ ] Su `User` (diagramma `User`):
  `email è univoca tra tutti gli User, PT e Athlete.`
- [ ] Su `Appointment` (diagramma `Coaching`), per A-02 flusso 6a:
  `Un atleta ha al più un Appointment in stato PENDING.`

Il vincolo sulla `Superset` con almeno due attività è nella voce 1.1. I vincoli su `AssignedWeek` e sulla coerenza di `AssignedExercise` sono nella voce 1.2.

## 4. Notazione

- [x] Tipi di ritorno mancanti:
  
  - `Athlete.isFreeIn(startDate : LocalDate, endDate : LocalDate) : boolean`
  - `PlanAssignment.canMoveTo(newStart : LocalDate) : boolean`
  - `RestPauseDecorator.getRestTimeBetweenReps() : Duration`
  
  Quelli di `WorkoutActivity`, dei decoratori e di `TrainingSession` sono già nelle voci 1.3 e 1.4.

- [x] Refuso: in `PlanAssignment.moveTo(newStart : localDate)` scrivi `LocalDate`

- [x] Visibilità. Gaphor disegna `+` davanti agli attributi senza visibilità; metti `-` a:
  
  - `ExerciseType`: `name`, `description`, `targetMuscleGroup`, `musclesInvolved`
  - `DropSetDecorator`: `dropRepsWeightMultiplier`
  - `RestPauseDecorator`: `restTimeBetweenReps`
  - `Weight`: `value`, `weightMeasureUnit`
  - `Address`: `street`, `city`, `postalCode`

- [x] Navigabilità. In un modello di dominio di solito non si specifica, e oggi le frecce compaiono solo su alcune associazioni. Nel pannello dell'associazione imposta *Unknown navigation* sul lato con la freccia, in questi 11 casi:
  
  - `TrainingSession` → `WorkoutActivity`
  - `Superset` → `WorkoutActivity`
  - `WorkoutActivityDecorator` → `WorkoutActivity`
  - `Exercise` → `Reps`
  - `Exercise` → `ExerciseType`
  - `AssignedExercise` → `Reps`
  - `AssignedExercise` → `TrainingSession`
  - `AssignedExercise` → `Exercise`
  - `TrainingPlan` → `MonthlyBlock`
  - `MonthlyBlock` → `TrainingSession`
  - `Athlete` → `Gym`
  
  La composizione `PlanAssignment` → `AssignedExercise` non è in elenco perché la voce 1.2 la elimina. Le due composizioni nuove della voce 1.2 nascono già senza freccia, se segui le istruzioni lì.
  
  L'alternativa è specificare la navigabilità su tutte le associazioni. L'importante è non lasciarla a metà.

- [x] Nomi di ruolo:
  
  - `TrainingSession`–`WorkoutActivity`: cancella il nome dell'associazione (`exercises`) e scrivi `activities` come nome del lato `WorkoutActivity`
  - `Superset`–`WorkoutActivity`: lato `WorkoutActivity` con nome `activities`
  - `MonthlyBlock`–`TrainingSession`: lato `TrainingSession` con nome `sessions`

- [x] Ordine. Gaphor 3.3.2 non salva `{ordered}`: il testo tra graffe sul lato viene ignorato. Aggiungi quindi una nota `{ordered}` accanto ai lati `activities` (l'ordine degli esercizi conta) e `sessions`. I blocchi hanno già `MonthlyBlock.order`.

- [x] Ruoli dei pattern, nei diagrammi `Exercises` e `_Domain Model`. Rinomina le etichette in quest'ordine, per non confonderle:
  
  1. `«Decorator»` (sotto `DropSetDecorator` e `RestPauseDecorator`) diventa `«ConcreteDecorator»`
  2. `«AbstractDecorator»` (verso `WorkoutActivityDecorator`) diventa `«Decorator»`
  3. `«AbstractComponent»` (verso `WorkoutActivity`) diventa `«Component»`
  
  `«ConcreteComponent»`, `«Component»`, `«Composite»` e `«Leaf»` restano come sono. Così i nomi sono quelli GoF, e `WorkoutActivity` ha lo stesso ruolo nei due pattern. Attenzione: le linee dei ruoli sono agganciate solo all'ellisse, non alle classi. Se sposti una classe, la linea va riposizionata a mano.

- [x] `Exercise`: cancella la nota "reps = -1 -> cedimento", superata da `FailureReps`. Nel PNG non si vede, ma chi apre il `.gaphor` la legge.

## 5. Prima di esportare e inviare

- [ ] Tipi di diagramma. `User`, `TrainingPlan` e `Shared` sono Package Diagram (cornice `pkg`), mentre `Exercises` e `Coaching` sono Class Diagram (`cls`). Per ciascuno dei tre:
  1. crea un Class Diagram nello stesso package;
  2. nel vecchio diagramma seleziona tutto e copia;
  3. nel nuovo incolla con **Paste**, non con *Paste (copy defining elements)*, che duplicherebbe le classi;
  4. controlla il risultato, elimina il vecchio diagramma e dai al nuovo lo stesso nome.
- [ ] `Exercises` e `Shared`: seleziona tutto e sposta gli elementi verso l'angolo in alto a sinistra. L'export include sempre l'origine, e oggi in `Exercises` metà immagine è vuota.
- [ ] `_BusinessLogic` è vuoto: non inviarlo, oppure eliminalo.
- [ ] `_Domain Model` (3323×1835 px, con linee lunghe tra i package) non si legge su una pagina A4. Valuta di ridurlo ai soli package e alle loro relazioni, e di mandare i dettagli con i diagrammi per package. Attenzione: in questo diagramma, trascinare una classe dentro o fuori da un riquadro ne cambia il package.
- [ ] Esporta i diagrammi. Il PDF è vettoriale e resta nitido anche rimpicciolito, quindi è il formato migliore da inviare o da includere nella SRS:
  `gaphor export -u -f pdf -o <cartella> docs/softwarereqspec/src/diagrams/class/domain_model.gaphor`
  Per i PNG usa `-f png`.

## Verifica

Quando le modifiche sono applicate, rileggere il `.gaphor` e rigenerare gli export, poi confrontarli voce per voce con questo file.
