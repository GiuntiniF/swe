#!/usr/bin/env -S uv run
"""Aggiunge le classi dei Controllers a una COPIA del modello Gaphor.

Legge le firme da spec.md (in questa cartella): ogni "## Controllers/<Sub>"
indica il sottopackage, ogni "### <Classe>" la classe, e ogni riga dei
blocchi ``` sotto la classe è un'operazione (se ha le parentesi) o un
attributo. Le righe passano allo stesso parser che Gaphor usa nella scheda
Operazioni/Attributi.

Cosa fa, sulla copia:
  - crea i sottopackage di "App PT/Controllers" che mancano;
  - crea le classi che mancano, nel loro sottopackage;
  - aggiunge le operazioni e gli attributi che mancano (stesso nome: salta);
  - toglie dalle classi dei Controllers le operazioni il cui nome contiene
    una parentesi: sono firme incollate male (più righe in una).

Cosa NON fa: diagrammi, viste, associazioni. Le classi compaiono nel browser
del modello: trascinale nei diagrammi e disegna tu le associazioni.

Il file originale non viene mai scritto. La copia va accanto all'originale:
    docs/softwarereqspec/src/diagrams/class/domain_model.controllers.gaphor
Se la copia esiste già, lo script si ferma: cancellala o rinominala prima.

Uso (dalla radice del repo, con Gaphor chiuso o con il modello salvato):
    gaphor exec .scratch/controllers/genera_controllers.py
oppure
    uv run .scratch/controllers/genera_controllers.py

Percorsi diversi con le variabili d'ambiente CONTROLLERS_MODEL (modello da
leggere) e CONTROLLERS_OUT (copia da scrivere).
"""

import os
import re
import sys
from pathlib import Path

from gaphor import UML
from gaphor.application import Session
from gaphor.storage import storage
from gaphor.UML.group import group
from gaphor.UML.umllex import parse_operation, parse_property

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
SPEC = HERE / "spec.md"
MODEL = Path(
    os.environ.get(
        "CONTROLLERS_MODEL",
        REPO / "docs/softwarereqspec/src/diagrams/class/domain_model.gaphor",
    )
)
OUT = Path(
    os.environ.get(
        "CONTROLLERS_OUT", MODEL.with_name(MODEL.stem + ".controllers.gaphor")
    )
)


def read_spec(path):
    """{sottopackage: {classe: [righe]}} nell'ordine della spec."""
    result = {}
    sub = cls = None
    in_block = False
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("```"):
            in_block = not in_block
            continue
        if in_block:
            if sub and cls and line.strip():
                result[sub][cls].append(line.strip())
            continue
        if m := re.match(r"^## Controllers/(\w+)\s*$", line):
            sub, cls = m.group(1), None
            result[sub] = {}
        elif line.startswith("## "):
            sub = cls = None
        elif sub and (m := re.match(r"^### (\w+)\s*$", line)):
            cls = m.group(1)
            result[sub][cls] = []
    return result


def load(path):
    session = Session(
        services=[
            "event_manager",
            "component_registry",
            "element_factory",
            "element_dispatcher",
            "modeling_language",
        ]
    )
    factory = session.get_service("element_factory")
    with open(path, encoding="utf-8") as f:
        storage.load(f, factory, session.get_service("modeling_language"))
    return factory


def child_package(factory, parent, name):
    for p in factory.select(UML.Package):
        if p.name == name and p.nestingPackage is parent:
            return p, False
    p = factory.create(UML.Package)
    p.name = name
    group(parent, p)
    return p, True


def find_class(factory, controllers, name):
    """La classe con quel nome sotto Controllers (a qualunque profondità)."""
    for c in factory.select(UML.Class):
        if c.name != name:
            continue
        pkg = c.package
        while pkg is not None:
            if pkg is controllers:
                return c
            pkg = pkg.nestingPackage
    return None


def main():
    if not SPEC.exists():
        sys.exit(f"Spec non trovata: {SPEC}")
    if not MODEL.exists():
        sys.exit(f"Modello non trovato: {MODEL}")
    if OUT.resolve() == MODEL.resolve():
        sys.exit("La copia coincide con l'originale: lo script non lo scrive mai.")
    if OUT.exists():
        sys.exit(f"La copia esiste già: {OUT}\nCancellala o rinominala prima.")

    spec = read_spec(SPEC)
    factory = load(MODEL)

    roots = [
        p for p in factory.select(UML.Package)
        if p.name == "App PT" and p.nestingPackage is None
    ]
    if len(roots) != 1:
        sys.exit("Package radice 'App PT' non trovato (o non unico).")
    controllers, new = child_package(factory, roots[0], "Controllers")
    if new:
        print("+ package Controllers")

    added = skipped = removed = 0
    for sub, classes in spec.items():
        pkg, new = child_package(factory, controllers, sub)
        if new:
            print(f"+ package Controllers/{sub}")
        for name, lines in classes.items():
            cls = find_class(factory, controllers, name)
            if cls is None:
                cls = factory.create(UML.Class)
                cls.name = name
                group(pkg, cls)
                print(f"+ classe {sub}/{name}")
            elif cls.package is not pkg:
                print(f"! {name} esiste già in {cls.package.name}, non in {sub}: lasciata lì")

            for op in list(cls.ownedOperation):
                if op.name and ("(" in op.name or "\n" in op.name):
                    print(f"- {name}: tolta l'operazione incollata male {op.name[:50]!r}…")
                    op.unlink()
                    removed += 1

            ops = {o.name for o in cls.ownedOperation}
            attrs = {a.name for a in cls.ownedAttribute if a.association is None}
            for line in lines:
                if "(" in line:
                    opname = line.split("(", 1)[0].strip()
                    if opname in ops:
                        skipped += 1
                        continue
                    op = factory.create(UML.Operation)
                    cls.ownedOperation = op
                    parse_operation(op, line)
                    ops.add(opname)
                else:
                    attrname = line.split(":", 1)[0].strip()
                    if attrname in attrs:
                        skipped += 1
                        continue
                    attr = factory.create(UML.Property)
                    cls.ownedAttribute = attr
                    parse_property(attr, line)
                    attrs.add(attrname)
                added += 1

    with open(OUT, "w", encoding="utf-8") as f:
        storage.save(f, factory)

    print(
        f"\nAggiunti {added} tra operazioni e attributi, saltati {skipped} già presenti, "
        f"tolti {removed} incollati male."
    )
    print(f"Copia scritta in: {OUT}")
    print("Aprila in Gaphor e controllala. Se va bene, sostituisci l'originale:")
    print(f"    mv {OUT} {MODEL}")


if __name__ == "__main__":
    main()
