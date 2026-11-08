#!/usr/bin/env -S uv run
"""Esporta da Gaphor tutti i diagrammi del modello, pronti per \\includegraphics.

Per ogni diagramma non vuoto del modello:
  1. lo disegna in PDF senza la linguetta in alto a sinistra ("cls User",
     "pkg ...", "uc ...");
  2. ritaglia il PDF con `pdfcrop --margins "0 0 5 5"` (5pt solo a destra
     e in basso).

Il file PDF prende il nome del diagramma e va nella cartella della sezione,
cioè del primo package sotto la radice del modello (vedi output_path):
    App PT/BusinessLogic/User/User         -> BusinessLogic/User.pdf
    App PT/DAO/Shared/Shared               -> DAO/Shared.pdf
    App PT/Domain Model/User/User          -> class/User.pdf
    App PT/SystemArchitecture              -> SystemArchitecture.pdf
I nuovi package e diagrammi vengono esportati senza modificare lo script.
Il file .gaphor non viene modificato.

Uso (da qualsiasi cartella dentro il repo; le dipendenze Python sono nel
progetto uv alla radice, `pyproject.toml`):
    uv run docs/softwarereqspec/src/diagrams/export_diagrams.py
    uv run docs/softwarereqspec/src/diagrams/export_diagrams.py BusinessLogic
    uv run docs/softwarereqspec/src/diagrams/export_diagrams.py "Domain Model/User"

Oltre al progetto uv serve `pdfcrop` (TeX Live), che non è un pacchetto Python.
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
from gaphor.diagram.export import escape_filename, render

HERE = Path(__file__).resolve().parent
DEFAULT_MODEL = HERE / "class" / "domain_model.gaphor"

# Cartella di una sezione, se diversa dal nome del package.
# "" = direttamente in questa cartella.
SECTION_DIRS = {
    "Domain Model": "class",
    "Use Case Diagram": "",
}

PDFCROP_MARGINS = "0 0 5 5"  # sinistra sopra destra sotto, in pt

# Gaphor disegna in px; Inkscape li converteva in PDF a 96 dpi (1px = 0.75pt).
# Stessa scala, così le dimensioni restano quelle dei PDF già nella SRS.
PT_PER_PX = 72 / 96


def package_names(diagram):
    """Nomi dei package che contengono il diagramma, dalla radice in giù."""
    names = []
    package = diagram.owner
    while package:
        names.insert(0, package.name)
        package = package.owningPackage
    return names


def diagram_path(diagram):
    return "/".join([*package_names(diagram), diagram.name])


def output_path(diagram):
    """Percorso del PDF, relativo a questa cartella."""
    packages = package_names(diagram)
    file_name = escape_filename(diagram.name) + ".pdf"
    if len(packages) < 2:  # diagramma direttamente nella radice del modello
        return Path(file_name)
    section = packages[1]
    folder = SECTION_DIRS.get(section, escape_filename(section))
    return Path(folder) / file_name


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
    return sorted(factory.select(Diagram), key=diagram_path)


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
        "filters",
        nargs="*",
        help="esporta solo i diagrammi il cui percorso nel modello contiene "
        'uno di questi testi (es. BusinessLogic, "Domain Model/User"); '
        "senza argomenti li esporta tutti",
    )
    parser.add_argument(
        "--model", type=Path, default=DEFAULT_MODEL, help="file .gaphor da usare"
    )
    args = parser.parse_args()

    if not shutil.which("pdfcrop"):
        sys.exit("pdfcrop non trovato: installa TeX Live (texlive-binextra).")

    diagrams = load_diagrams(args.model)
    filters = [f.lower() for f in args.filters]
    selected = [
        d
        for d in diagrams
        if not filters or any(f in diagram_path(d).lower() for f in filters)
    ]
    if not selected:
        sys.exit(
            f"Nessun diagramma corrisponde a: {' '.join(args.filters)}\n"
            "Diagrammi presenti:\n  " + "\n  ".join(map(diagram_path, diagrams))
        )

    # Due diagrammi con lo stesso nome nella stessa sezione finirebbero
    # nello stesso file: meglio fermarsi che sovrascriverne uno.
    targets = {}
    for d in diagrams:
        targets.setdefault(output_path(d), []).append(diagram_path(d))
    clashes = {out: paths for out, paths in targets.items() if len(paths) > 1}
    if clashes:
        sys.exit(
            "Diagrammi diversi finirebbero nello stesso file; rinominane uno:\n"
            + "\n".join(f"  {out}: {', '.join(p)}" for out, p in clashes.items())
        )

    for d in selected:
        if not any(d.get_all_items()):
            print(f"{diagram_path(d)}: vuoto, saltato")
            continue
        out = output_path(d)
        export_pdf(d, HERE / out)
        print(f"{diagram_path(d)} -> {out}")


if __name__ == "__main__":
    main()
