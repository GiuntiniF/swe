#!/usr/bin/python
"""Esporta da Gaphor i diagrammi usati nella SRS, pronti per \\includegraphics.

Per ogni diagramma della tabella DIAGRAMS:
  1. lo disegna in PDF senza la linguetta in alto a sinistra ("cls User",
     "pkg ...", "uc ...");
  2. ritaglia il PDF con `pdfcrop --margins "0 0 5 5"` (5pt solo a destra
     e in basso).

Il file .gaphor non viene modificato.

Uso (dalla cartella del repo o da qualsiasi altra):
    docs/softwarereqspec/src/diagrams/export_diagrams.py
    docs/softwarereqspec/src/diagrams/export_diagrams.py User Gym

Richiede Gaphor installato nel Python di sistema e `pdfcrop` (TeX Live).
"""

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

import cairo
import gaphor.storage as storage
from gaphor.application import Session
from gaphor.core.modeling import Diagram
from gaphor.diagram.export import render

HERE = Path(__file__).resolve().parent
DEFAULT_MODEL = HERE / "class" / "domain_model.gaphor"

# Percorso del diagramma nel modello (package/.../nome) -> file PDF,
# relativo a questa cartella. Per aggiungere un diagramma alla SRS basta
# aggiungere una riga qui.
DIAGRAMS = {
    "App PT/Domain Model/Package Diagram of Domain Model": "class/Package_Diagram_of_Domain_Model.pdf",
    "App PT/Domain Model/User/User": "class/User.pdf",
    "App PT/Domain Model/Gym/Gym": "class/Gym.pdf",
    "App PT/Domain Model/Coaching/Coaching": "class/Coaching.pdf",
    "App PT/Domain Model/TrainingPlan/TrainingPlan": "class/TrainingPlan.pdf",
    "App PT/Domain Model/Exercises/Exercises": "class/Exercises.pdf",
    "App PT/Domain Model/ValueType/ValueType": "class/ValueType.pdf",
    "App PT/Use Case Diagram/Use Case Diagram": "useCaseDiagram.pdf",
    "App PT/SystemArchitecture": "SystemArchitecture.pdf",
}

PDFCROP_MARGINS = "0 0 5 5"  # sinistra sopra destra sotto, in pt

# Gaphor disegna in px; Inkscape li converteva in PDF a 96 dpi (1px = 0.75pt).
# Stessa scala, così le dimensioni restano quelle dei PDF già nella SRS.
PT_PER_PX = 72 / 96


def diagram_path(diagram):
    parts = [diagram.name]
    package = diagram.owner
    while package:
        parts.insert(0, package.name)
        package = package.owningPackage
    return "/".join(parts)


def load_diagrams(model):
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
    with open(model, encoding="utf-8") as file_obj:
        storage.load(file_obj, factory, session.get_service("modeling_language"))
    return {diagram_path(d): d for d in factory.select(Diagram)}


def export_pdf(diagram, out):
    out.parent.mkdir(parents=True, exist_ok=True)

    def new_surface(w, h):
        surface = cairo.PDFSurface(str(out), w * PT_PER_PX, h * PT_PER_PX)
        surface.set_device_scale(PT_PER_PX, PT_PER_PX)
        return surface

    render(diagram, new_surface, with_diagram_type=False)
    subprocess.run(
        ["pdfcrop", "--margins", PDFCROP_MARGINS, str(out), str(out)],
        check=True,
        stdout=subprocess.DEVNULL,
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "names",
        nargs="*",
        help="esporta solo i diagrammi con questo nome (es. User Gym); "
        "senza argomenti li esporta tutti",
    )
    parser.add_argument(
        "--model", type=Path, default=DEFAULT_MODEL, help="file .gaphor da usare"
    )
    args = parser.parse_args()

    if not shutil.which("pdfcrop"):
        sys.exit("pdfcrop non trovato: installa TeX Live (texlive-binextra).")

    selected = {
        path: out
        for path, out in DIAGRAMS.items()
        if not args.names or path.rsplit("/", 1)[-1] in args.names
    }
    if not selected:
        sys.exit(f"Nessun diagramma corrisponde a: {' '.join(args.names)}")

    diagrams = load_diagrams(args.model)
    missing = [path for path in selected if path not in diagrams]
    if missing:
        sys.exit(
            "Diagrammi non trovati nel modello (rinominati o spostati?):\n  "
            + "\n  ".join(missing)
            + "\nDiagrammi presenti:\n  "
            + "\n  ".join(sorted(diagrams))
        )

    for path, out in selected.items():
        target = HERE / out
        export_pdf(diagrams[path], target)
        print(f"{path} -> {target.relative_to(HERE)}")


if __name__ == "__main__":
    main()
